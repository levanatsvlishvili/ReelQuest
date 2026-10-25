output "dynamodb_table_name" {
  description = "DynamoDB Single Table Name"
  value       = module.dynamodb.table_name
}

output "dynamodb_table_arn" {
  description = "DynamoDB Single Table ARN"
  value       = module.dynamodb.table_arn
}

output "dynamodb_stream_arn" {
  description = "DynamoDB Stream ARN for Outbox Relay Lambda"
  value       = module.dynamodb.stream_arn
}

output "eventbridge_bus_name" {
  description = "Custom EventBridge Bus Name"
  value       = module.eventbridge.event_bus_name
}

output "leaderboard_queue_url" {
  description = "Leaderboard SQS FIFO Queue URL"
  value       = module.eventbridge.leaderboard_queue_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_app_client_id" {
  description = "Cognito SPA Client ID"
  value       = module.cognito.client_id
}

output "api_gateway_endpoint" {
  description = "API Gateway HTTP API Invoke Endpoint"
  value       = module.api_gateway.api_endpoint
}

output "frontend_s3_bucket" {
  description = "Frontend S3 Bucket Name"
  value       = module.static_hosting.bucket_name
}

output "cloudfront_domain_name" {
  description = "CloudFront Distribution Domain URL"
  value       = module.static_hosting.cloudfront_domain_name
}

output "admin_s3_bucket" {
  description = "Admin Portal S3 Bucket Name"
  value       = module.admin_hosting.bucket_name
}

output "admin_cloudfront_distribution_id" {
  description = "Admin Portal CloudFront Distribution ID"
  value       = module.admin_hosting.cloudfront_distribution_id
}

output "admin_cloudfront_domain_name" {
  description = "Admin Portal CloudFront Domain URL"
  value       = module.admin_hosting.cloudfront_domain_name
}
