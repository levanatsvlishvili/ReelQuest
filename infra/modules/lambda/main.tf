# Fallback archive for initial terraform plan when jar is not yet built
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "placeholder"
    filename = "placeholder.txt"
  }
}

locals {
  game_jar_exists = var.game_service_jar_path != "" && fileexists(var.game_service_jar_path)
  game_jar        = local.game_jar_exists ? var.game_service_jar_path : data.archive_file.placeholder.output_path
  game_jar_hash   = local.game_jar_exists ? filebase64sha256(var.game_service_jar_path) : data.archive_file.placeholder.output_base64sha256

  outbox_jar_exists = var.outbox_relay_jar_path != "" && fileexists(var.outbox_relay_jar_path)
  outbox_jar        = local.outbox_jar_exists ? var.outbox_relay_jar_path : data.archive_file.placeholder.output_path
  outbox_jar_hash   = local.outbox_jar_exists ? filebase64sha256(var.outbox_relay_jar_path) : data.archive_file.placeholder.output_base64sha256

  billing_jar_exists = var.billing_service_jar_path != "" && fileexists(var.billing_service_jar_path)
  billing_jar        = local.billing_jar_exists ? var.billing_service_jar_path : data.archive_file.placeholder.output_path
  billing_jar_hash   = local.billing_jar_exists ? filebase64sha256(var.billing_service_jar_path) : data.archive_file.placeholder.output_base64sha256
}

# ==========================================
# 1. Game Service Lambda (API Handler + SnapStart)
# ==========================================

resource "aws_iam_role" "game_service" {
  name = "${var.app_name}-${var.environment}-game-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "game_service_basic" {
  role       = aws_iam_role.game_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "game_service_dynamodb" {
  name = "${var.app_name}-${var.environment}-game-service-dynamodb"
  role = aws_iam_role.game_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:TransactWriteItems"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "game_service" {
  function_name = "${var.app_name}-${var.environment}-game-service"
  role          = aws_iam_role.game_service.arn
  handler       = "io.reelquest.game.handler.GameApiHandler::handleRequest"
  runtime       = "java21"
  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 15

  filename         = local.game_jar
  source_code_hash = local.game_jar_hash
  publish          = true

  snap_start {
    apply_on = "PublishedVersions"
  }

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_alias" "game_service_live" {
  name             = "live"
  description      = "Active SnapStart alias"
  function_name    = aws_lambda_function.game_service.function_name
  function_version = aws_lambda_function.game_service.version
}

# ==========================================
# 2. Outbox Relay Lambda (DynamoDB Streams -> EventBridge)
# ==========================================

resource "aws_iam_role" "outbox_relay" {
  name = "${var.app_name}-${var.environment}-outbox-relay-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "outbox_relay_basic" {
  role       = aws_iam_role.outbox_relay.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "outbox_relay_dynamodb_stream" {
  role       = aws_iam_role.outbox_relay.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaDynamoDBExecutionRole"
}

resource "aws_iam_role_policy" "outbox_relay_policy" {
  name = "${var.app_name}-${var.environment}-outbox-relay-policy"
  role = aws_iam_role.outbox_relay.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem"
        ]
        Resource = var.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = var.eventbridge_bus_arn
      }
    ]
  })
}

resource "aws_lambda_function" "outbox_relay" {
  function_name = "${var.app_name}-${var.environment}-outbox-relay"
  role          = aws_iam_role.outbox_relay.arn
  handler       = "io.reelquest.outbox.handler.OutboxRelayHandler::handleRequest"
  runtime       = "java21"
  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 30

  filename         = local.outbox_jar
  source_code_hash = local.outbox_jar_hash

  environment {
    variables = {
      EVENT_BUS_NAME = var.eventbridge_bus_name
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "dynamodb_to_outbox" {
  event_source_arn  = var.dynamodb_stream_arn
  function_name     = aws_lambda_function.outbox_relay.arn
  starting_position = "LATEST"
  batch_size        = 10
}

# ==========================================
# 3. Leaderboard Consumer Lambda (SQS FIFO -> DynamoDB)
# ==========================================

resource "aws_iam_role" "leaderboard_consumer" {
  name = "${var.app_name}-${var.environment}-leaderboard-consumer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "leaderboard_consumer_basic" {
  role       = aws_iam_role.leaderboard_consumer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "leaderboard_consumer_sqs" {
  role       = aws_iam_role.leaderboard_consumer.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole"
}

resource "aws_iam_role_policy" "leaderboard_consumer_policy" {
  name = "${var.app_name}-${var.environment}-leaderboard-consumer-policy"
  role = aws_iam_role.leaderboard_consumer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "leaderboard_consumer" {
  function_name = "${var.app_name}-${var.environment}-leaderboard-consumer"
  role          = aws_iam_role.leaderboard_consumer.arn
  handler       = "io.reelquest.outbox.handler.LeaderboardConsumerHandler::handleRequest"
  runtime       = "java21"
  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 30

  filename         = local.outbox_jar
  source_code_hash = local.outbox_jar_hash

  environment {
    variables = {
      DYNAMODB_TABLE = var.dynamodb_table_name
    }
  }

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "sqs_to_leaderboard" {
  event_source_arn = var.leaderboard_queue_arn
  function_name    = aws_lambda_function.leaderboard_consumer.arn
  batch_size       = 10
}

# ==========================================
# 4. Billing Service Lambda (SAGA Orchestrator + SnapStart)
# ==========================================

resource "aws_iam_role" "billing_service" {
  name = "${var.app_name}-${var.environment}-billing-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "billing_service_basic" {
  role       = aws_iam_role.billing_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "billing_service_policy" {
  name = "${var.app_name}-${var.environment}-billing-service-policy"
  role = aws_iam_role.billing_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:TransactWriteItems"
        ]
        Resource = [
          var.dynamodb_table_arn,
          "${var.dynamodb_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminGetUser"
        ]
        Resource = var.cognito_user_pool_arn != "" ? var.cognito_user_pool_arn : "*"
      }
    ]
  })
}

resource "aws_lambda_function" "billing_service" {
  function_name = "${var.app_name}-${var.environment}-billing-service"
  role          = aws_iam_role.billing_service.arn
  handler       = "io.reelquest.billing.handler.BillingApiHandler::handleRequest"
  runtime       = "java21"
  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 15

  filename         = local.billing_jar
  source_code_hash = local.billing_jar_hash
  publish          = true

  snap_start {
    apply_on = "PublishedVersions"
  }

  environment {
    variables = {
      DYNAMODB_TABLE       = var.dynamodb_table_name
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    }
  }

  tags = var.tags
}

resource "aws_lambda_alias" "billing_service_live" {
  name             = "live"
  description      = "Active SnapStart alias for Billing Service"
  function_name    = aws_lambda_function.billing_service.function_name
  function_version = aws_lambda_function.billing_service.version
}
