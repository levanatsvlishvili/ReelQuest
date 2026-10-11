variable "bucket_name" {
  description = "Globally unique name for frontend S3 bucket"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application base name"
  type        = string
  default     = "reelquest"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
