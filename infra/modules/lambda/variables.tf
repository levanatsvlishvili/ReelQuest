variable "app_name" {
  description = "Application base name"
  type        = string
  default     = "reelquest"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}

variable "dynamodb_stream_arn" {
  description = "ARN of the DynamoDB table stream"
  type        = string
}

variable "eventbridge_bus_name" {
  description = "Name of the EventBridge custom bus"
  type        = string
}

variable "eventbridge_bus_arn" {
  description = "ARN of the EventBridge custom bus"
  type        = string
}

variable "leaderboard_queue_arn" {
  description = "ARN of the Leaderboard SQS FIFO Queue"
  type        = string
}

variable "game_service_jar_path" {
  description = "Path to game-service uber-JAR"
  type        = string
  default     = ""
}

variable "outbox_relay_jar_path" {
  description = "Path to outbox-relay uber-JAR"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
