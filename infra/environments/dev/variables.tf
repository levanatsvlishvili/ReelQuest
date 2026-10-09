variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-central-1"
}

variable "app_name" {
  description = "Application base name"
  type        = string
  default     = "reelquest"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}
