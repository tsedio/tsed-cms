# AWS Region
variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "eu-west-1" # Default to Europe (Ireland)
}

variable "aws_endpoint_host" {
  description = "The AWS host for endpoints"
  type        = string
  default     = null
}

variable "aws_s3_endpoint_host" {
  description = "The endpoint for S3 service"
  type        = string
  default     = null
}

variable "aws_access_key" {
  description = "The AWS access key for authentication"
  type        = string
  default     = "" # Should be set in the environment or Terraform Cloud variables
}

variable "aws_secret_key" {
  description = "The AWS secret key for authentication"
  type        = string
  default     = "" # Should be set in the environment or Terraform Cloud variables
}

variable "aws_s3_use_path_style" {
  description = "Use path-style URLs for S3 buckets"
  type        = bool
  default     = true # Set to true for compatibility with older S3 clients
}

variable "aws_skip_credentials_validation" {
  description = "Skip credentials validation for S3"
  type        = bool
  default     = false # Useful for local testing or when using IAM roles
}

variable "aws_skip_metadata_api_check" {
  description = "Skip metadata API check for S3"
  type        = bool
  default     = false # Useful for local testing or when using IAM roles
}

variable "aws_skip_requesting_account_id" {
  description = "Skip requesting account ID for S3"
  type        = bool
  default     = false # Useful for local testing or when using IAM roles
}

# S3 Bucket Name
variable "bucket_name" {
  description = "The name of the S3 bucket for Directus storage"
  type        = string
  default     = "directus-storage-bucket"
}

# Environment
variable "environment" {
  description = "The environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Allowed Origins for CORS
variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"] # Should be restricted in production
}

# IAM User Name
variable "iam_user_name" {
  description = "The name of the IAM user for Directus"
  type        = string
  default     = "directus-s3-user"
}