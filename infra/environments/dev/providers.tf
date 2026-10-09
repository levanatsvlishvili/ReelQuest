terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # For remote state in production, an S3 backend + DynamoDB lock can be configured here.
  # For local/dev bootstrapping, local state is used by default.
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.app_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "https://github.com/reelquest"
    }
  }
}
