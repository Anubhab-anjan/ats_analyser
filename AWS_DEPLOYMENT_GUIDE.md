# AWS Hosting and Deployment Guide
## Cloud-Native AI Resume Analysis and ATS Scoring Platform

This document provides a step-by-step technical guide for provisioning, deploying, and configuring the AI ATS Resume Analyzer on Amazon Web Services (AWS) using public cloud infrastructure.

---

## 1. Cloud Architecture Overview

The system utilizes an enterprise cloud architecture pattern designed for high availability, fault tolerance, and security compliance:

```
[ Client Web Browser ]
         |
         | HTTP (Port 80) / HTTPS (Port 443)
         v
[ AWS EC2 Security Group ] (Inbound: 22, 80, 443)
         |
         v
[ Nginx Reverse Proxy ] (Gzip, Rate Limiting, Port 80 -> Port 3000)
         |
         v
[ Node.js Express Application ] (Managed via systemd, Port 3000)
         |
         +----> [ Amazon S3 Bucket ] (Stores resume documents and JSON analysis reports)
         |            ^
         |            | (Secured via IAM Role, no hardcoded API keys)
         v
[ Amazon CloudWatch ] (System resource metrics, application access logs)
```

### AWS Services Employed
1. **Amazon EC2 (Elastic Compute Cloud)**: Virtual server hosting the Node.js application and Nginx reverse proxy.
2. **Amazon S3 (Simple Storage Service)**: Scalable object storage for uploaded resumes (`/resumes/`) and generated ATS scoring reports (`/reports/`).
3. **AWS IAM (Identity and Access Management)**: Role-based access control granting EC2 temporary credentials to read and write to the designated S3 bucket.
4. **Amazon CloudWatch**: Centralized metrics collection for CPU utilization, network traffic, memory utilization, and application logs.
5. **AWS VPC Security Groups**: Network-level stateful firewall controlling inbound and outbound traffic.

---

## 2. Step 1: Create and Configure an Amazon S3 Bucket

1. Sign in to the AWS Management Console and open the **Amazon S3** console at `https://console.aws.amazon.com/s3/`.
2. Click **Create bucket**.
3. Configure the following bucket settings:
   - **Bucket name**: `ats-resume-analysis-[your-group-id]` (Bucket names must be globally unique across all AWS accounts).
   - **AWS Region**: Select `us-east-1` (US East, N. Virginia) or your designated primary region.
   - **Object Ownership**: ACLs disabled (recommended).
   - **Block Public Access settings for this bucket**: Keep **Block all public access** enabled. The EC2 instance will communicate securely with S3 via IAM permissions, eliminating the need for public bucket exposure.
   - **Bucket Versioning**: Enable (optional, protects against accidental deletion).
   - **Default encryption**: Server-side encryption with Amazon S3 managed keys (SSE-S3).
4. Click **Create bucket**.
5. Inside the bucket, you can optionally create two folders for logical organization:
   - `resumes/`
   - `reports/`

---

## 3. Step 2: Create an IAM Role for EC2 S3 Access

Using an IAM Role eliminates hardcoded access keys on the server, following the principle of least privilege.

1. Open the **IAM Console** at `https://console.aws.amazon.com/iam/`.
2. Navigate to **Roles** in the left navigation pane and click **Create role**.
3. Under **Trusted entity type**, select **AWS service**.
4. Under **Use case**, select **EC2** and click **Next**.
5. On the **Add permissions** screen, click **Create policy** (opens in a new tab):
   - Select the **JSON** tab and paste the following scoped policy (replace `ats-resume-analysis-your-group-id` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ResumeOperations",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:HeadBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ats-resume-analysis-your-group-id",
        "arn:aws:s3:::ats-resume-analysis-your-group-id/*"
      ]
    }
  ]
}
```

6. Click **Next**, name the policy `EC2-ATS-S3-AccessPolicy`, and click **Create policy**.
7. Return to the Create Role browser tab, refresh the policies list, search for `EC2-ATS-S3-AccessPolicy`, select the checkbox, and click **Next**.
8. Name the role `EC2-ATS-Application-Role` and click **Create role**.

---

## 4. Step 3: Configure AWS EC2 Security Group

1. Open the **Amazon EC2 Console** at `https://console.aws.amazon.com/ec2/`.
2. Under **Network & Security**, click **Security Groups** -> **Create security group**.
3. Configure:
   - **Security group name**: `ats-web-server-sg`
   - **Description**: Allow inbound SSH, HTTP, and HTTPS traffic.
   - **VPC**: Select your default VPC.
4. Add the following **Inbound rules**:
   - **Rule 1**: Type: `SSH`, Port Range: `22`, Source: `My IP` (or `0.0.0.0/0` if team members use dynamic IPs).
   - **Rule 2**: Type: `HTTP`, Port Range: `80`, Source: `0.0.0.0/0` (Anywhere IPv4).
   - **Rule 3**: Type: `HTTPS`, Port Range: `443`, Source: `0.0.0.0/0` (Anywhere IPv4).
5. **Outbound rules**: Default rule allowing all outbound traffic (`0.0.0.0/0`) to allow package updates and S3 API calls.
6. Click **Create security group**.

---

## 5. Step 4: Launch the Amazon EC2 Instance

1. In the EC2 Console, click **Launch instance**.
2. Set the following parameters:
   - **Name**: `ATS-Resume-Analyzer-Production`
   - **Application and OS Images (Amazon Machine Image)**: Select **Amazon Linux 2023 AMI** (64-bit x86) or **Ubuntu Server 24.04 LTS**. Both are AWS Free Tier eligible.
   - **Instance type**: `t2.micro` (or `t3.micro` depending on region availability; 1 vCPU, 1 GiB Memory, Free Tier eligible).
   - **Key pair (login)**: Select an existing key pair or click **Create new key pair** (RSA, `.pem` format for OpenSSH / macOS / Linux, or `.ppk` for PuTTY). Download and securely store the private key file.
   - **Network settings**: Click **Edit**:
     - VPC: Default VPC.
     - Auto-assign public IP: **Enable**.
     - Select existing security group: Choose `ats-web-server-sg`.
   - **Configure storage**: 15 GiB General Purpose SSD (gp3).
   - **Advanced details**:
     - **IAM instance profile**: Select `EC2-ATS-Application-Role` created in Step 2.
3. Click **Launch instance**.
4. Once the instance status transitions to **Running**, copy its **Public IPv4 address** and **Public IPv4 DNS**.

---

## 6. Step 5: Connect and Deploy the Application

### 6.1 Connect via SSH
From your local terminal, navigate to the folder containing your key pair `.pem` file and run:

```bash
# Set file permissions for the private key
chmod 400 your-key-pair.pem

# Connect to the EC2 instance (for Amazon Linux 2023)
ssh -i "your-key-pair.pem" ec2-user@<YOUR-EC2-PUBLIC-IP>

# If using Ubuntu AMI, use ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### 6.2 Install System Dependencies (Node.js 20, Git, Nginx)
Run the following commands on the EC2 shell:

```bash
# Update installed packages
sudo dnf update -y

# Install Git and Nginx
sudo dnf install -y git nginx

# Install Node.js 20.x from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify runtimes
node -v
npm -v
```

### 6.3 Clone and Prepare the Application Codebase
```bash
# Clone the repository into ec2-user home directory
cd /home/ec2-user
git clone https://github.com/<your-organization>/ai-ats-resume-analyzer.git
cd ai-ats-resume-analyzer

# Install production dependencies
npm install --omit=dev

# Create local storage folders for upload fallback
mkdir -p uploads reports
```

### 6.4 Configure Environment Variables
Create a production `.env` file:

```bash
nano .env
```

Paste the following configuration:

```env
PORT=3000
NODE_ENV=production
AWS_REGION=us-east-1
AWS_BUCKET_NAME=ats-resume-analysis-your-group-id
```

Save and exit (`Ctrl + O`, then `Enter`, then `Ctrl + X`).

*Note: Since the EC2 instance has the IAM Role attached, do not enter AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY. The AWS SDK v3 will automatically acquire temporary credentials from the EC2 Instance Metadata Service (IMDSv2).*

---

## 7. Step 6: Configure systemd Service for Process Management

To ensure the Node.js application runs continuously in the background and restarts automatically on instance reboot or failure, create a systemd service:

```bash
sudo nano /etc/systemd/system/ats-app.service
```

Add the following unit configuration:

```ini
[Unit]
Description=AI ATS Resume Analyzer Node.js Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/ai-ats-resume-analyzer
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ats-app
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=AWS_REGION=us-east-1
Environment=AWS_BUCKET_NAME=ats-resume-analysis-your-group-id

[Install]
WantedBy=multi-user.target
```

Reload systemd daemon, enable, and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ats-app
sudo systemctl start ats-app

# Verify service status
sudo systemctl status ats-app
```

---

## 8. Step 7: Configure Nginx as Reverse Proxy

Nginx acts as a high-performance web server handling port 80/443 traffic, terminating client connections, compressing responses via gzip, and proxying requests to the Node.js service running on internal port 3000.

Create the Nginx configuration file:

```bash
sudo nano /etc/nginx/conf.d/ats-app.conf
```

Paste the following configuration:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 15M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

Validate and start Nginx:

```bash
# Test configuration syntax
sudo nginx -t

# Enable and start Nginx service
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## 9. Step 8: Verify Deployment and End-to-End Operation

1. Open your web browser and navigate to:
   `http://<YOUR-EC2-PUBLIC-IP>`
2. Check the system status indicator in the top navbar: it should indicate `Online: AWS S3 Connected`.
3. Test the Health Endpoint directly:
   `http://<YOUR-EC2-PUBLIC-IP>/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "ai-ats-resume-analyzer",
     "cloudProvider": "Amazon Web Services (AWS)",
     "storage": {
       "configuredType": "AWS_S3",
       "bucketName": "ats-resume-analysis-your-group-id",
       "isS3Healthy": true
     }
   }
   ```
4. Perform an end-to-end evaluation:
   - Click **Load Sample Cloud Engineer JD**.
   - Click **Cloud Engineer (High Score)**.
   - Click **Analyze and Compute ATS Score**.
   - Verify that the ATS score dial, category breakdown, matched skills, and recommendations appear.
5. In the AWS Management Console, navigate to your S3 bucket:
   - Inspect the `resumes/` folder to confirm the uploaded resume document is stored.
   - Inspect the `reports/` folder to confirm the generated analysis JSON report is saved.

---

## 10. Step 9: Configure Amazon CloudWatch Monitoring

1. Open the **Amazon CloudWatch Console** at `https://console.aws.amazon.com/cloudwatch/`.
2. Under **Metrics**, select **EC2** -> **Per-Instance Metrics**.
3. Select your instance ID to view:
   - `CPUUtilization`
   - `NetworkIn` and `NetworkOut`
   - `StatusCheckFailed`
4. Set up a CloudWatch Alarm:
   - Metric: `CPUUtilization` > 80% for 5 minutes.
   - Action: Send notification via Amazon SNS to the student team email addresses.

---

## 11. Cost Optimization & Free Tier Verification

All services selected in this implementation fall within the AWS Free Tier allowances for student accounts:

| Cloud Service | Allocated Resource | Free Tier Monthly Allowance | Estimated Project Cost |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | 1x `t2.micro` or `t3.micro` | 750 hours/month | $0.00 |
| **Amazon EBS** | 15 GB gp3 Storage | 30 GB/month | $0.00 |
| **Amazon S3** | Standard Storage (< 100 MB) | 5 GB standard storage, 20,000 GET, 2,000 PUT | $0.00 |
| **Data Transfer** | Outbound to Internet (< 1 GB) | 100 GB/month | $0.00 |
| **AWS IAM** | Identity & Access Management | Always Free | $0.00 |
| **Total Cost** | | | **$0.00 / Month** |
