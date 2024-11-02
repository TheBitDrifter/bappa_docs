provider "aws" {
  region = "us-east-1"
}

# S3 bucket
resource "aws_s3_bucket" "bappa_doc_bucket" {
  bucket = "bappa-docs"
  acl    = "private"
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "bappa_doc_identity" {
  comment = "Allows access to the bappa-doc bucket only from CloudFront"
}

# S3 bucket policy
resource "aws_s3_bucket_policy" "bappa_doc_policy" {
  bucket = aws_s3_bucket.bappa_doc_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Allow CloudFront access to S3 bucket"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.bappa_doc_identity.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.bappa_doc_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Function for directory index handling
resource "aws_cloudfront_function" "directory_index" {
  name    = "directory-index"
  runtime = "cloudfront-js-1.0"
  comment = "Add index.html to directory requests"
  publish = true
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if URI is empty or root
    if (uri === "") {
        request.uri = "/index.html";
        return request;
    }
    
    // Remove multiple forward slashes
    uri = uri.replace(/\/+/g, "/");
    
    // Check whether the URI ends with forward slash
    if (uri.endsWith('/')) {
        request.uri = uri + 'index.html';
    } 
    // Check whether the URI doesn't have an extension
    else if (!uri.includes('.')) {
        request.uri = uri + '/index.html';
    }
    
    return request;
}
EOT
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "bappa_doc_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_All"

  origin {
    domain_name = aws_s3_bucket.bappa_doc_bucket.bucket_regional_domain_name
    origin_id   = "S3-Bappa-Doc"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.bappa_doc_identity.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Bappa-Doc"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600    # 1 hour
    max_ttl                = 86400   # 24 hours

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.directory_index.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "bappa-doc-cloudfront-distribution"
  }
}

# Outputs
output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.bappa_doc_distribution.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.bappa_doc_distribution.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.bappa_doc_bucket.id
}
