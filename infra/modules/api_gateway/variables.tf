variable "app_name" {
  description = "Application base name"
  type        = string
  default     = "reelquest"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "game_service_lambda_arn" {
  description = "ARN of Game Service Lambda (SnapStart alias)"
  type        = string
}

variable "game_service_function_name" {
  description = "Name of Game Service Lambda function"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
