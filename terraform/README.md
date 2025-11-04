# Terraform Configuration for Directus S3 Storage

This Terraform configuration sets up an AWS S3 bucket for use with Directus CMS, along with the necessary IAM user and permissions.

## Resources Created

- **S3 Bucket**: A private S3 bucket for storing Directus files (accessible only via IAM credentials)
- **IAM User**: A dedicated IAM user for Directus to access the S3 bucket
- **IAM Policy**: A policy that grants the necessary permissions to read, update, and delete content in the S3 bucket
- **IAM Access Key**: Access credentials for the IAM user

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) (v1.0.0 or newer)
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create S3 buckets and IAM resources

## Usage

1. Initialize the Terraform configuration:

```bash
cd terraform
terraform init
```

2. Review the planned changes:

```bash
terraform plan
```

3. Apply the configuration:

```bash
terraform apply
```

4. After applying, Terraform will output the necessary configuration values for Directus:

```bash
terraform output
```

To see sensitive values:

```bash
terraform output access_key_id
terraform output secret_access_key
terraform output directus_s3_config
```

## Environment-Specific Configurations

This project includes environment-specific variable files for different deployment scenarios in the `envs` directory:

### LocalStack (Local Development)

To use the LocalStack configuration for local development:

```bash
terraform plan -var-file=envs/localstack.tfvars
terraform apply -var-file=envs/localstack.tfvars
```

This configuration:
- Uses LocalStack endpoints (http://localhost:4566)
- Sets test credentials
- Enables path-style S3 URLs (required for LocalStack)
- Skips AWS validations (necessary for local development)

### Production

To use the production configuration:

```bash
terraform plan -var-file=envs/production.tfvars
terraform apply -var-file=envs/production.tfvars
```

Alternatively, you can use the provided script to automatically provision the production environment using credentials from the `.credentials/.env.production` file:

```bash
./provision-production.sh
```

The `.credentials/.env.production` file should contain your AWS credentials in the following format:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
```

Note: Do not use quotes around the values, and ensure there are no extra spaces or special characters at the beginning of the file.

This script will:
1. Source AWS credentials from `.credentials/.env.production`
2. Initialize Terraform if needed
3. Apply the configuration using the production variables
4. Clean up sensitive environment variables after completion

This configuration:
- Uses standard AWS endpoints
- Uses credentials from `.credentials/.env.production` when using the script, or from environment variables/AWS profiles otherwise
- Uses virtual-hosted style S3 URLs
- Enforces proper AWS validation
- Restricts CORS to specific domains

## Configuring Directus

To configure Directus to use the S3 bucket, add the following to your Directus environment variables:

```env
STORAGE_LOCATIONS=s3
STORAGE_S3_DRIVER=s3
STORAGE_S3_KEY=<access_key_id>
STORAGE_S3_SECRET=<secret_access_key>
STORAGE_S3_BUCKET=<s3_bucket_name>
STORAGE_S3_REGION=<s3_bucket_region>
STORAGE_S3_ENDPOINT=https://s3.<region>.amazonaws.com
```

Replace the placeholders with the values from the Terraform outputs.

## Customization

You can customize the configuration by modifying the variables in `variables.tf`. The following variables are available:

- `aws_region`: The AWS region to deploy resources (default: "eu-west-1")
- `bucket_name`: The name of the S3 bucket (default: "directus-storage-bucket")
- `environment`: The environment tag (default: "dev")
- `allowed_origins`: List of allowed origins for CORS (default: ["*"])
- `iam_user_name`: The name of the IAM user (default: "directus-s3-user")

## Security Considerations

- The S3 bucket is configured with private ACL and blocks all public access
- Objects in the bucket are only accessible using the IAM credentials
- In production, you should restrict the `allowed_origins` variable to specific domains
- The IAM policy follows the principle of least privilege, granting only the necessary permissions
- Access keys are marked as sensitive in the Terraform output
