output "api_id" {
  description = "The ID of the API Gateway HTTP API"
  value       = aws_apigatewayv2_api.main.id
}

output "api_endpoint" {
  description = "The default invoke endpoint URL of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}
