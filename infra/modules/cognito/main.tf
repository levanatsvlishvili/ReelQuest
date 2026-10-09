# Cognito User Pool for Authentication & Role Management
resource "aws_cognito_user_pool" "main" {
  name = var.user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "ReelQuest — Verification Code"
    email_message        = "Welcome to ReelQuest! Your verification code is {####}."
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = merge(
    var.tags,
    {
      Name        = var.user_pool_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  )
}

# SPA Web Client (No client secret required for browser apps)
resource "aws_cognito_user_pool_client" "spa_client" {
  name         = "${var.user_pool_name}-spa-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  access_token_validity  = 60 # 60 minutes
  id_token_validity      = 60
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

# Default Free Tier User Group
resource "aws_cognito_user_group" "free_users" {
  name         = "FreeUsers"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Standard tier users with daily game limits"
  precedence   = 10
}

# Pro Tier User Group (Granted/Revoked via SAGA Pattern)
resource "aws_cognito_user_group" "pro_users" {
  name         = "ProUsers"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Premium tier users with unlimited games and analytics"
  precedence   = 1
}
