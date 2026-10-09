# Custom Event Bus for ReelQuest Domain Events
resource "aws_cloudwatch_event_bus" "main" {
  name = var.bus_name

  tags = merge(
    var.tags,
    {
      Name        = var.bus_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# Dead Letter Queue (DLQ) for failed event processing
resource "aws_sqs_queue" "leaderboard_dlq" {
  name                        = "${var.bus_name}-leaderboard-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600 # 14 days

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# Main FIFO Queue for Leaderboard & Achievements Consumer
resource "aws_sqs_queue" "leaderboard_queue" {
  name                        = "${var.bus_name}-leaderboard.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = 60
  message_retention_seconds   = 86400 # 1 day

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.leaderboard_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# SQS Queue Policy granting EventBridge permissions to publish
resource "aws_sqs_queue_policy" "leaderboard_queue_policy" {
  queue_url = aws_sqs_queue.leaderboard_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowEventBridgeToSendMessages"
        Effect    = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.leaderboard_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.game_completed_rule.arn
          }
        }
      }
    ]
  })
}

# EventBridge Rule routing GameCompleted events
resource "aws_cloudwatch_event_rule" "game_completed_rule" {
  name           = "${var.bus_name}-game-completed-rule"
  event_bus_name = aws_cloudwatch_event_bus.main.name
  description    = "Routes GameCompleted events to Leaderboard SQS FIFO Queue"

  event_pattern = jsonencode({
    source      = ["reelquest.game"]
    detail-type = ["GameCompleted"]
  })

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# EventBridge Target to SQS Queue
resource "aws_cloudwatch_event_target" "leaderboard_target" {
  rule           = aws_cloudwatch_event_rule.game_completed_rule.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  target_id      = "LeaderboardQueueTarget"
  arn            = aws_sqs_queue.leaderboard_queue.arn

  sqs_target {
    message_group_id = "LeaderboardUpdates"
  }
}
