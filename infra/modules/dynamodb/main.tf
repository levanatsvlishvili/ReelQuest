resource "aws_dynamodb_table" "main" {
  name         = var.table_name
  billing_mode = var.billing_mode
  hash_key     = "PK"
  range_key    = "SK"

  # Core primary keys
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # Global Secondary Index 1 (GSI1) for inverted lookups & leaderboards
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # DynamoDB Streams for Transactional Outbox Pattern & CDC
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Automatic cleanup for Idempotency locks and transient sessions
  ttl {
    attribute_name = "ExpiresAt"
    enabled        = true
  }

  # Server-Side Encryption (Default AWS-managed key, free)
  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }

  tags = merge(
    var.tags,
    {
      Name        = var.table_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}
