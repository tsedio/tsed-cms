# IAM User for Directus
resource "aws_iam_user" "directus_user" {
  name = var.iam_user_name
  path = "/system/"

  tags = {
    Name        = "Directus S3 User"
    Environment = var.environment
    Project     = "digital-cms-api"
  }
}

# IAM Access Key for the Directus User
resource "aws_iam_access_key" "directus_user_key" {
  user = aws_iam_user.directus_user.name
}

# IAM Policy for S3 Access
resource "aws_iam_policy" "directus_s3_policy" {
  name        = "DirectusS3Access"
  description = "Policy that grants Directus access to S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
        ]
        Effect   = "Allow"
        Resource = aws_s3_bucket.directus_storage.arn
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl",
          "s3:GetObjectAcl",
        ]
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.directus_storage.arn}/*"
      }
    ]
  })
}

# Attach the policy to the user
resource "aws_iam_user_policy_attachment" "directus_user_policy_attachment" {
  user       = aws_iam_user.directus_user.name
  policy_arn = aws_iam_policy.directus_s3_policy.arn
}