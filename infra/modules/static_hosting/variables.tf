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

variable "aliases" {
  description = "List of custom domain aliases (CNAMEs) for CloudFront"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM Certificate ARN in us-east-1 for CloudFront HTTPS"
  type        = string
  default     = null
}
