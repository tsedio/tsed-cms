# S3 Bucket Outputs
output "s3_bucket_name" {
  description = "The name of the S3 bucket"
  value       = aws_s3_bucket.directus_storage.bucket
}

output "s3_bucket_region" {
  description = "The region of the S3 bucket"
  value       = var.aws_region
}

output "s3_bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.directus_storage.arn
}

output "s3_bucket_domain_name" {
  description = "The domain name of the S3 bucket (requires authentication)"
  value       = "${aws_s3_bucket.directus_storage.bucket}.s3.${var.aws_region}.amazonaws.com"
}

output "s3_bucket_public_url" {
  description = "The URL for accessing the S3 bucket (requires authentication)"
  value       = "https://${aws_s3_bucket.directus_storage.bucket}.s3.${var.aws_region}.amazonaws.com"
}

# IAM User Outputs
output "iam_user_name" {
  description = "The name of the IAM user"
  value       = aws_iam_user.directus_user.name
}

output "iam_user_arn" {
  description = "The ARN of the IAM user"
  value       = aws_iam_user.directus_user.arn
}

# IAM Access Key Outputs
output "access_key_id" {
  description = "The access key ID"
  value       = aws_iam_access_key.directus_user_key.id
  sensitive   = true
}

output "secret_access_key" {
  description = "The secret access key. This will be written to the state file in plain-text."
  value       = aws_iam_access_key.directus_user_key.secret
  sensitive   = true
}

# Directus Configuration Helper
output "directus_s3_config" {
  description = "Configuration values for Directus S3 storage"
  value = {
    driver     = "s3"
    key        = aws_iam_access_key.directus_user_key.id
    endpoint   = "https://s3.${var.aws_region}.amazonaws.com"
    bucket     = aws_s3_bucket.directus_storage.bucket
    region     = var.aws_region
    public_url = "https://${aws_s3_bucket.directus_storage.bucket}.s3.${var.aws_region}.amazonaws.com"
  }
  sensitive = true
}
