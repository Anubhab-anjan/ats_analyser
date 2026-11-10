# ats_analyser: Cloud-Native AI Resume Analysis & ATS Scoring Platform

An enterprise-grade Applicant Tracking System (ATS) resume parser and semantic scoring platform deployed on Amazon Web Services (AWS). Evaluates technical skill coverage, cosine semantic relevance, measurable business outcomes, and structural document formatting.

---

## 1. Project Overview

- **Course:** Cloud Computing Final Project
- **Target Cloud Infrastructure:** Amazon Web Services (AWS)
- **Services Used:** Amazon EC2, Amazon S3, AWS IAM, Amazon CloudWatch, VPC Security Groups, Nginx
- **Team Size:** 3 Students
- **Deliverables Included:**
  1. Complete Source Code, Assets & Configurations
  2. Academic Project Report (`PROJECT_REPORT.md`)
  3. Step-by-Step AWS Hosting Guide (`AWS_DEPLOYMENT_GUIDE.md`)
  4. 10-Minute Video Presentation Script (`VIDEO_PRESENTATION_SCRIPT.md`)

---

## 2. Directory Structure

```
ai_analysis/
├── server.js                        # Express server, REST endpoints, Multer upload, AWS S3 integration
├── package.json                     # Node.js dependencies and run scripts
├── .env.example                     # Environment configuration template
├── .env                             # Local environment variables
├── lib/
│   ├── parser.js                    # Multi-format document parser (PDF, DOCX, TXT)
│   ├── nlpEngine.js                 # NLP tokenization, TF-IDF vectorizer, cosine similarity
│   ├── skillsDatabase.js            # Taxonomy of 500+ technical skills and action verbs
│   ├── atsScorer.js                 # Multi-factor weighted ATS scoring algorithm
│   └── s3Service.js                 # AWS S3 integration with resilient local fallback
├── public/
│   ├── index.html                   # Professional web interface (No emojis)
│   ├── style.css                    # Responsive stylesheet, score dials, and progress bars
│   └── app.js                       # Frontend client logic, health polling, report rendering
├── sample-data/
│   ├── sample_resume.txt            # Industry-standard Cloud Engineer resume (High score: ~72/100)
│   ├── sample_resume_poor.txt       # Unformatted resume (Low score: ~6/100)
│   └── sample_job_description.txt   # Target Cloud Infrastructure & DevOps job description
├── aws-deployment/
│   ├── Dockerfile                   # Multi-stage production container image
│   ├── docker-compose.yml           # Container orchestration
│   ├── nginx.conf                   # Nginx reverse proxy configuration for EC2
│   ├── ats-app.service              # Linux systemd service unit file
│   └── ec2-user-data.sh             # Cloud-Init automated EC2 provisioning script
├── uploads/                         # Local storage directory for uploaded resumes
├── reports/                         # Local storage directory for generated analysis JSON reports
├── AWS_DEPLOYMENT_GUIDE.md          # Complete step-by-step AWS hosting walkthrough
├── PROJECT_REPORT.md                # Comprehensive academic project report
├── VIDEO_PRESENTATION_SCRIPT.md     # 10-minute presentation guide for 3 group members
└── README.md                        # Project documentation and execution instructions
```

---

## 3. Core Features & Scoring Algorithm

The platform evaluates resumes across four weighted dimensions:

1. **Required Skills Coverage (35% weight):**
   Scans the resume against required technologies and methodologies extracted from the job description using a knowledge base of 500+ technical skills.
2. **Semantic & Content Relevance (25% weight):**
   Computes Term Frequency - Inverse Document Frequency (TF-IDF) vector representations and calculates mathematical Cosine Similarity between the candidate resume and the job description.
3. **Quantifiable Impact & Action Verbs (20% weight):**
   Detects high-impact action verbs (such as *architected*, *streamlined*, *spearheaded*) and extracts quantitative metrics (percentages, dollar amounts, throughput metrics).
4. **ATS Formatting & Structural Compliance (20% weight):**
   Verifies standard section headings, contact information completeness (email, phone, LinkedIn), document word count, and format parseability.

---

## 4. Local Execution Instructions

### Prerequisites
- Node.js (version 18.x or 20.x LTS)
- npm (version 9.x or higher)

### Setup & Run
1. Install project dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure environment variables in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=
   ```
   *Note: If `AWS_BUCKET_NAME` is left empty, the application automatically uses local disk storage (`./uploads` and `./reports`).*

3. Start the application:
   ```bash
   npm start
   ```

4. Access the web dashboard in your browser:
   `http://localhost:3000`

---

## 5. Docker Deployment

To build and run the application using Docker:

```bash
# Build the container image
docker build -t ats-analyzer -f aws-deployment/Dockerfile .

# Run the container
docker run -d -p 3000:3000 --name ats_app ats-analyzer

# Verify container health
curl http://localhost:3000/api/health
```

Or using Docker Compose:

```bash
docker-compose -f aws-deployment/docker-compose.yml up -d
```

---

## 6. AWS Hosting Summary

For complete, detailed instructions, refer to `AWS_DEPLOYMENT_GUIDE.md`.

### Quick AWS Architecture Summary:
1. **Amazon S3**: Create a private S3 bucket (e.g., `ats-resume-analysis-group-bucket`).
2. **AWS IAM**: Create an IAM Role (`EC2-ATS-Application-Role`) with permissions to `PutObject`, `GetObject`, and `ListBucket` on your S3 bucket.
3. **Amazon EC2**: Launch a `t2.micro` instance (Amazon Linux 2023 or Ubuntu 24.04 LTS) and attach the IAM Role.
4. **Security Group**: Configure inbound rules for Port 22 (SSH), Port 80 (HTTP), and Port 443 (HTTPS).
5. **Nginx Reverse Proxy**: Place `aws-deployment/nginx.conf` at `/etc/nginx/conf.d/ats-app.conf` to forward port 80 traffic to Node.js port 3000.
6. **systemd Service**: Install `aws-deployment/ats-app.service` in `/etc/systemd/system/` to manage the Node.js application process with automatic restarts.

---

## 7. REST API Endpoints

### 1. `POST /api/analyze`
Submits a resume document and job description for ATS evaluation.
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `resume` (File, required): PDF, DOCX, or TXT file (up to 10MB).
  - `jobDescription` (Text, required): Target job requirements.
  - `candidateName` (Text, optional): Candidate name override.
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "reportId": "uuid-v4",
    "data": {
      "overallScore": 72,
      "ratingLevel": "Good Match",
      "scores": {
        "skillScore": 69,
        "semanticScore": 45,
        "impactScore": 90,
        "structureScore": 93
      },
      "skillsAnalysis": {
        "matchedCount": 25,
        "missingCount": 11,
        "matchedSkills": ["aws", "ec2", "s3", "docker", "kubernetes", "terraform"],
        "missingSkills": ["helm", "argocd"]
      },
      "storage": {
        "fileStorageType": "AWS_S3",
        "fileLocation": "s3://ats-bucket/resumes/1700000000_resume.txt"
      }
    }
  }
  ```

### 2. `GET /api/health`
Health check endpoint for AWS Application Load Balancer and CloudWatch.
- **Response (200 OK):**
  ```json
  {
    "status": "healthy",
    "service": "ai-ats-resume-analyzer",
    "uptimeSeconds": 1420,
    "cloudProvider": "Amazon Web Services (AWS)",
    "storage": {
      "configuredType": "AWS_S3",
      "bucketName": "your-bucket-name",
      "isS3Healthy": true
    }
  }
  ```

### 3. `GET /api/history`
Returns list of recently analyzed resumes and scores.

### 4. `GET /api/report/:id`
Retrieves full evaluation report JSON by report ID.

### 5. `GET /api/samples`
Retrieves pre-loaded sample job descriptions and test resumes.

---

## 8. Group Members and Responsibilities

- **Student 1 (Cloud & Infrastructure Lead):** AWS EC2, S3, IAM Roles, Security Groups, Nginx reverse proxy, systemd deployment.
- **Student 2 (Backend & AI Engine Lead):** Document parsers (PDF/DOCX), NLP tokenization, TF-IDF cosine similarity, weighted scoring engine, AWS SDK v3 integration.
- **Student 3 (Frontend & Evaluation Lead):** UI dashboard, progress visualizations, empirical benchmarking, sample testing, video presentation.
