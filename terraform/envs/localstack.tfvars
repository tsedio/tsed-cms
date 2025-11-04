# LocalStack Configuration

# AWS Region
aws_region = "eu-west-1"  # Europe (Ireland)

# LocalStack endpoints
aws_endpoint_host = "http://localhost:4566"
aws_s3_endpoint_host = "http://localhost:4566"

# LocalStack credentials (can be any non-empty string)
aws_access_key = "test"
aws_secret_key = "test"

# S3 path style is required for LocalStack
aws_s3_use_path_style = true

# Skip AWS validations for LocalStack
aws_skip_credentials_validation = true
aws_skip_metadata_api_check = true
aws_skip_requesting_account_id = true

# S3 Bucket Name
bucket_name = "directus-storage-bucket-local"

# Environment
environment = "dev"

# Allowed Origins for CORS - In development, we can be more permissive
allowed_origins = ["*"]

# IAM User Name
iam_user_name = "directus-s3-user-local"