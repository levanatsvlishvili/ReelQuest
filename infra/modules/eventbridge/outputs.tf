output "event_bus_name" {
  description = "Name of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.main.name
}

output "event_bus_arn" {
  description = "ARN of the custom EventBridge event bus"
  value       = aws_cloudwatch_event_bus.main.arn
}

output "leaderboard_queue_url" {
  description = "URL of the Leaderboard SQS FIFO Queue"
  value       = aws_sqs_queue.leaderboard_queue.id
}

output "leaderboard_queue_arn" {
  description = "ARN of the Leaderboard SQS FIFO Queue"
  value       = aws_sqs_queue.leaderboard_queue.arn
}
