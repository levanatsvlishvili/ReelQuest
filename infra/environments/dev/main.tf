# ==========================================
# ReelQuest Dev Environment Core Infrastructure
# ==========================================

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
