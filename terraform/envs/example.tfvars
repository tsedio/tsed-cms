# AWS Region
aws_region = "eu-west-1"

# S3 Bucket Name - Should be unique across all of AWS
bucket_name = "your-company-directus-storage"

# Environment
environment = "dev"  # Change to "staging" or "prod" as needed

# Allowed Origins for CORS - Restrict to your domains in production
allowed_origins = [
  "https://your-directus-domain.com",
  "https://admin.your-company.com"
]

# IAM User Name
iam_user_name = "your-company-directus-s3-user"