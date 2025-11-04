# Production Configuration

# AWS Region
aws_region = "eu-west-1"  # Europe (Ireland)

# AWS endpoints - use default AWS endpoints
aws_endpoint_host = null
aws_s3_endpoint_host = null

# AWS credentials should be provided via environment variables or AWS profiles
# These are intentionally left empty as they should not be stored in version control
aws_access_key = ""
aws_secret_key = ""

# Standard S3 configuration for production
aws_s3_use_path_style = false

# Use standard AWS validation for production
aws_skip_credentials_validation = false
aws_skip_metadata_api_check = false
aws_skip_requesting_account_id = false

# S3 Bucket Name - should be globally unique
bucket_name = "cms-digital-api-prod"

# Environment
environment = "prod"

# Allowed Origins for CORS - Restrict to specific domains in production
allowed_origins = [
  "*"
]

# IAM User Name
iam_user_name = "cms-digital-api-s3-user-prod"
