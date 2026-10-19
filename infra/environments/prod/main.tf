# ==========================================
# ReelQuest Prod Environment Core Infrastructure
# ==========================================

data "aws_caller_identity" "current" {}

# 1. DynamoDB Single-Table Design + Streams + TTL
module "dynamodb" {
  source = "../../modules/dynamodb"

  table_name   = "${var.app_name}-${var.environment}-data"
  billing_mode = "PAY_PER_REQUEST"
  environment  = var.environment
}

# 2. EventBridge Event Bus + SQS FIFO Queue + DLQ
module "eventbridge" {
  source = "../../modules/eventbridge"

  bus_name    = "${var.app_name}-${var.environment}-bus"
  environment = var.environment
}

# 3. Cognito User Pool + App Client + Free/Pro Groups
module "cognito" {
  source = "../../modules/cognito"

  user_pool_name = "${var.app_name}-${var.environment}-users"
  environment    = var.environment
}

# 4. Serverless Java 21 Lambdas (SnapStart, Outbox Relay, Leaderboard Consumer, Billing SAGA)
module "lambda" {
  source = "../../modules/lambda"

  app_name                 = var.app_name
  environment              = var.environment
  dynamodb_table_name      = module.dynamodb.table_name
  dynamodb_table_arn       = module.dynamodb.table_arn
  dynamodb_stream_arn      = module.dynamodb.stream_arn
  eventbridge_bus_name     = module.eventbridge.event_bus_name
  eventbridge_bus_arn      = module.eventbridge.event_bus_arn
  leaderboard_queue_arn    = module.eventbridge.leaderboard_queue_arn
  game_service_jar_path    = "${path.root}/../../../backend/game-service/target/game-service-1.0.0-SNAPSHOT.jar"
  outbox_relay_jar_path    = "${path.root}/../../../backend/outbox-relay/target/outbox-relay-1.0.0-SNAPSHOT.jar"
  billing_service_jar_path = "${path.root}/../../../backend/billing-service/target/billing-service-1.0.0-SNAPSHOT.jar"
  cognito_user_pool_id     = module.cognito.user_pool_id
  cognito_user_pool_arn    = module.cognito.user_pool_arn
}

# 5. API Gateway HTTP API
module "api_gateway" {
  source = "../../modules/api_gateway"

  app_name                      = var.app_name
  environment                   = var.environment
  game_service_lambda_arn       = module.lambda.game_service_alias_arn
  game_service_function_name    = module.lambda.game_service_function_name
  billing_service_lambda_arn    = module.lambda.billing_service_alias_arn
  billing_service_function_name = module.lambda.billing_service_function_name
}

# 6. Frontend Static Hosting (S3 + CloudFront CDN + OAC)
module "static_hosting" {
  source = "../../modules/static_hosting"

  app_name    = var.app_name
  environment = var.environment
  bucket_name = "${var.app_name}-${var.environment}-frontend-${data.aws_caller_identity.current.account_id}"
}
