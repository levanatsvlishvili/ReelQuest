resource "aws_apigatewayv2_api" "main" {
  name          = "${var.app_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Idempotency-Key", "Authorization"]
    max_age       = 300
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "game_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.game_service_lambda_arn
  integration_method     = "POST"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_route" "daily" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /daily"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "shortest_path" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /shortest-path"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "leaderboard" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /leaderboard"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "submit_game" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /games/submit"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  tags = var.tags
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.game_service_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
  qualifier     = "live"
}
