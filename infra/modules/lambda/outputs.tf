output "game_service_function_name" {
  description = "Name of the Game Service Lambda function"
  value       = aws_lambda_function.game_service.function_name
}

output "game_service_function_arn" {
  description = "ARN of the Game Service Lambda function"
  value       = aws_lambda_function.game_service.arn
}

output "game_service_alias_arn" {
  description = "SnapStart live alias ARN for Game Service Lambda"
  value       = aws_lambda_alias.game_service_live.arn
}

output "outbox_relay_function_name" {
  description = "Name of the Outbox Relay Lambda function"
  value       = aws_lambda_function.outbox_relay.function_name
}

output "leaderboard_consumer_function_name" {
  description = "Name of the Leaderboard Consumer Lambda function"
  value       = aws_lambda_function.leaderboard_consumer.function_name
}
