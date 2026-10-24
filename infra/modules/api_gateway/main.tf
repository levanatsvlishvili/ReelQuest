resource "aws_apigatewayv2_api" "main" {
  name          = "${var.app_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Idempotency-Key", "Authorization", "Stripe-Signature"]
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

resource "aws_apigatewayv2_integration" "billing_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.billing_service_lambda_arn
  integration_method     = "POST"
  payload_format_version = "1.0"
}

resource "aws_apigatewayv2_authorizer" "cognito" {
  count            = var.cognito_user_pool_id != "" ? 1 : 0
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.app_name}-${var.environment}-cognito-authorizer"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
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

resource "aws_apigatewayv2_route" "game_hint" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /games/hint"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "leaderboard" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /leaderboard"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "submit_game" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /games/submit"
  target             = "integrations/${aws_apigatewayv2_integration.game_service.id}"
  authorization_type = length(aws_apigatewayv2_authorizer.cognito) > 0 ? "JWT" : "NONE"
  authorizer_id      = length(aws_apigatewayv2_authorizer.cognito) > 0 ? aws_apigatewayv2_authorizer.cognito[0].id : null
}

resource "aws_apigatewayv2_route" "actor_movies" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /actors/{actorId}/movies"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "movie_cast" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /movies/{movieId}/cast"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "create_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /duels/create"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "get_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /duels/{duelId}"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "join_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /duels/{duelId}/join"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "progress_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /duels/{duelId}/progress"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "submit_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /duels/{duelId}/submit"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "rematch_duel" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /duels/{duelId}/rematch"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "billing_checkout" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /billing/checkout"
  target    = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
}

resource "aws_apigatewayv2_route" "billing_webhook" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /billing/webhook"
  target    = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
}

resource "aws_apigatewayv2_route" "billing_simulate_webhook" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /billing/simulate-webhook"
  target    = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
}

resource "aws_apigatewayv2_route" "billing_order" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /billing/orders/{orderId}"
  target    = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
}

resource "aws_apigatewayv2_route" "user_profile" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /users/{userId}"
  target    = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
}

resource "aws_apigatewayv2_route" "user_history" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /users/{userId}/history"
  target    = "integrations/${aws_apigatewayv2_integration.game_service.id}"
}

resource "aws_apigatewayv2_route" "user_sync" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "POST /users/sync"
  target             = "integrations/${aws_apigatewayv2_integration.billing_service.id}"
  authorization_type = length(aws_apigatewayv2_authorizer.cognito) > 0 ? "JWT" : "NONE"
  authorizer_id      = length(aws_apigatewayv2_authorizer.cognito) > 0 ? aws_apigatewayv2_authorizer.cognito[0].id : null
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
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

resource "aws_lambda_permission" "billing_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGatewayBilling"
  action        = "lambda:InvokeFunction"
  function_name = var.billing_service_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
  qualifier     = "live"
}
