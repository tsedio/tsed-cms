# AWS Provider Configuration
provider "aws" {
  access_key                  = var.aws_access_key
  secret_key                  = var.aws_secret_key
  region                      = var.aws_region
  s3_use_path_style           = var.aws_s3_use_path_style
  skip_credentials_validation = var.aws_skip_credentials_validation
  skip_metadata_api_check     = var.aws_skip_metadata_api_check
  skip_requesting_account_id  = var.aws_skip_requesting_account_id

  endpoints {
    apigateway     = var.aws_endpoint_host
    apigatewayv2   = var.aws_endpoint_host
    cloudformation = var.aws_endpoint_host
    cloudwatch     = var.aws_endpoint_host
    cloudwatchlogs = var.aws_endpoint_host
    dynamodb       = var.aws_endpoint_host
    ec2            = var.aws_endpoint_host
    es             = var.aws_endpoint_host
    elasticache    = var.aws_endpoint_host
    firehose       = var.aws_endpoint_host
    iam            = var.aws_endpoint_host
    kinesis        = var.aws_endpoint_host
    lambda         = var.aws_endpoint_host
    rds            = var.aws_endpoint_host
    redshift       = var.aws_endpoint_host
    route53        = var.aws_endpoint_host
    s3             = var.aws_s3_endpoint_host // "http://s3.localhost.localstack.cloud:4566"
    secretsmanager = var.aws_endpoint_host
    ses            = var.aws_endpoint_host
    sns            = var.aws_endpoint_host
    sqs            = var.aws_endpoint_host
    ssm            = var.aws_endpoint_host
    stepfunctions  = var.aws_endpoint_host
    sts            = var.aws_endpoint_host
  }
}

# S3 Bucket for Directus
resource "aws_s3_bucket" "directus_storage" {
  bucket = var.bucket_name

  tags = {
    Name        = "Directus Storage"
    Environment = var.environment
    Project     = "digital-cms-api"
  }
}

# S3 Bucket ACL
resource "aws_s3_bucket_ownership_controls" "directus_storage" {
  bucket = aws_s3_bucket.directus_storage.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "directus_storage" {
  depends_on = [aws_s3_bucket_ownership_controls.directus_storage]

  bucket = aws_s3_bucket.directus_storage.id
  acl    = "private"
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "directus_storage" {
  bucket = aws_s3_bucket.directus_storage.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "directus_storage" {
  bucket = aws_s3_bucket.directus_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
