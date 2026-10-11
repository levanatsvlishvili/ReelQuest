output "bucket_name" {
  description = "Name of the S3 bucket hosting frontend static assets"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket hosting frontend static assets"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.cdn.domain_name
}
