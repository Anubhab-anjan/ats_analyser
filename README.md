ats_analyser: Cloud-Native AI Resume Analysis & ATS Scoring Platform

An enterprise-grade Applicant Tracking System (ATS) resume parser and semantic scoring platform deployed on Amazon Web Services (AWS). It evaluates technical skill coverage, TF-IDF cosine semantic relevance, measurable business outcomes, and structural document formatting, and returns a single 0 to 100 score with recommendations.

Live Demo: http://54.226.121.91/

Team
Name	Roll No.	Role
Anubhab Anjan Kumar Malik	B123022	Cloud & Infrastructure Lead
Diyal Mandal	B123055	Backend & AI Engine Lead
G Vanessa Reddy	B123058	Frontend & Evaluation Lead

Note: the closing slide of the presentation lists the last two IDs as B12055 and B12058, while the title slide lists B123055 and B123058. This README uses the title-slide IDs. Please confirm the correct ones.

1. Project Overview

Course: Cloud Computing, Final Project Target Cloud Infrastructure: Amazon Web Services (AWS) Services Used: Amazon EC2, Amazon S3, AWS IAM, Amazon CloudWatch, VPC Security Groups, Nginx Team Size: 3 Students

Deliverables Included:

Complete source code, assets and configurations
Academic project report (PROJECT_REPORT.md)
Step-by-step AWS hosting guide (AWS_DEPLOYMENT_GUIDE.md)
10-minute video presentation script (VIDEO_PRESENTATION_SCRIPT.md)
Project presentation (ATS_Resume_Analyser_Cloud_Project.pptx)
Problem Statement

More than 75% of Fortune 500 companies and recruiting platforms filter resumes with an ATS before a recruiter looks at them. Candidates fail this screening for four recurring reasons:

Opaque screening: candidates cannot see why an automated screen rejected their resume.
Keyword mismatches: identical skills described with different wording get filtered out.
Format parsing failures: tables, multi-column layouts and missing headers break ATS parsers.
No measurable impact: resumes list tasks instead of quantified results and action verbs.
Objectives
Multi-format ingestion: parse PDF, DOCX and TXT resumes without character corruption.
NLP semantic matching: tokenization, stopword removal and TF-IDF cosine similarity.
Skill extraction: match against a 500+ term taxonomy of languages, frameworks and cloud platforms.
Weighted ATS scoring: four factors combined into one 0 to 100 score with recommendations.
Cloud storage and security: S3 for storage, IAM roles for keyless access, EC2 with Nginx.
Local resilience: automatic fallback to local disk when AWS is unreachable.
2. Directory Structure
ai_analysis/
├── server.js                    # Express server, REST endpoints, Multer upload, AWS S3 integration
├── package.json                 # Node.js dependencies and run scripts
├── .env.example                 # Environment configuration template
├── .env                         # Local environment variables
├── lib/
│   ├── parser.js                # Multi-format document parser (PDF, DOCX, TXT)
│   ├── nlpEngine.js             # NLP tokenization, TF-IDF vectorizer, cosine similarity
│   ├── skillsDatabase.js        # Taxonomy of 500+ technical skills and action verbs
│   ├── atsScorer.js             # Multi-factor weighted ATS scoring algorithm
│   └── s3Service.js             # AWS S3 integration with resilient local fallback
├── public/
│   ├── index.html               # Professional web interface
│   ├── style.css                # Responsive stylesheet, score dials, and progress bars
│   └── app.js                   # Frontend client logic, health polling, report rendering
├── sample-data/
│   ├── sample_resume.txt        # Industry-standard Cloud Engineer resume (High score: ~72/100)
│   ├── sample_resume_poor.txt   # Unformatted resume (Low score: ~6/100)
│   └── sample_job_description.txt  # Target Cloud Infrastructure & DevOps job description
├── aws-deployment/
│   ├── Dockerfile               # Multi-stage production container image
│   ├── docker-compose.yml       # Container orchestration
│   ├── nginx.conf               # Nginx reverse proxy configuration for EC2
│   ├── ats-app.service          # Linux systemd service unit file
│   └── ec2-user-data.sh         # Cloud-Init automated EC2 provisioning script
├── uploads/                     # Local storage directory for uploaded resumes
├── reports/                     # Local storage directory for generated analysis JSON reports
├── AWS_DEPLOYMENT_GUIDE.md      # Complete step-by-step AWS hosting walkthrough
├── PROJECT_REPORT.md            # Comprehensive academic project report
├── VIDEO_PRESENTATION_SCRIPT.md # 10-minute presentation guide for 3 group members
└── README.md                    # Project documentation and execution instructions
3. Core Features & Scoring Algorithm

The platform evaluates resumes across four weighted dimensions:

S = 0.35 · Skills + 0.25 · Semantic + 0.20 · Impact + 0.20 · Structure
#	Dimension	Weight	How it is computed
1	Required Skills Coverage	35%	Matched job-description skills ÷ required skills × 100, using a knowledge base of 500+ technical skills.
2	Semantic & Content Relevance	25%	TF-IDF vector representations of resume and job description, compared with cosine similarity, scaled to 0 to 100.
3	Quantifiable Impact & Action Verbs	20%	Harmonic mean of action-verb diversity (70+ verbs such as architected, streamlined, spearheaded) and the count of quantified metrics (percentages, dollar amounts, throughput).
4	ATS Formatting & Structural Compliance	20%	Standard section headings, contact completeness (email, phone, LinkedIn), word count in the 300 to 1,200 range, and format parseability.
Processing Pipeline
Step	Stage	Description	Module
1	Parse	PDF via pdf-parse, DOCX via mammoth.js, TXT as UTF-8, then normalized	lib/parser.js
2	Tokenize	Stopwords removed; terms like c++, .net and ci/cd stay intact	lib/nlpEngine.js
3	Extract	Contacts, section headers, 70+ action verbs and quantified metrics	lib/atsScorer.js
4	Match skills	Resume checked against the 500+ term skills taxonomy	lib/skillsDatabase.js
5	Compare	TF-IDF cosine similarity between resume and job description	lib/nlpEngine.js
6	Score and store	Weighted ATS score returned; files and JSON report saved to S3	lib/s3Service.js
4. Results

The same job description (Cloud Infrastructure & DevOps) was scored against a strong and a weak resume.

Metric	Alex Morgan (strong)	John Doe (weak)
Overall	72 (Good Match)	6 (Poor Match)
Skills	69	3
Semantic	45	10
Impact	90	0
Structure	93	12
Alex Morgan: 5+ years of experience, 25 matched skills, quantified achievements, standard headings.
John Doe: no contact data or headers, 38 words, zero metrics. Six corrective recommendations are generated.
Performance

Measured end-to-end API latency is 477 ms (±45 ms), with a stable Node.js memory footprint of about 64 MB.

Stage	Latency (ms)
PDF parsing	142
NLP and skill extraction	28
TF-IDF and cosine similarity	12
S3 upload: resume	185
S3 upload: report	110
5. Local Execution Instructions
Prerequisites
Node.js (version 18.x or 20.x LTS)
npm (version 9.x or higher)
Setup & Run
Install project dependencies:
bash
npm install
(Optional) Configure environment variables in .env:
env
PORT=3000
NODE_ENV=development
AWS_REGION=us-east-1
AWS_BUCKET_NAME=

Note: If AWS_BUCKET_NAME is left empty, the application automatically uses local disk storage (./uploads and ./reports).

Start the application:
bash
npm start
Open the web dashboard at http://localhost:3000.
6. Docker Deployment
bash
# Build the container image
docker build -t ats-analyzer -f aws-deployment/Dockerfile .

# Run the container
docker run -d -p 3000:3000 --name ats_app ats-analyzer

# Verify container health
curl http://localhost:3000/api/health

Or using Docker Compose:

bash
docker-compose -f aws-deployment/docker-compose.yml up -d
7. AWS Architecture & Hosting

For complete instructions, refer to AWS_DEPLOYMENT_GUIDE.md.

Three-Tier Architecture
Tier	Components
Client	Browser single-page app (HTML5, CSS3, JavaScript): drag-and-drop upload, score dial and breakdown, matched and missing keywords
Compute (AWS)	Amazon EC2 on Amazon Linux 2023; Nginx reverse proxy on port 80 (15 MB upload buffer, gzip) forwarding to Node.js / Express on port 3000 under systemd (parser, NLP, TF-IDF, ATS scorer)
Storage (AWS)	Amazon S3 private bucket with SSE-S3 encryption, holding /resumes/ and /reports/; accessed via AWS SDK v3 with an IAM role

Amazon CloudWatch monitors CPU, network and disk metrics plus systemd journald logs, with an alarm when CPU exceeds 80%.

Request flow: Browser → HTTP(S) 80/443 → Nginx → :3000 Node.js → SDK v3 + IAM role → S3

AWS Services Used
Service	Purpose
Amazon EC2	t3.micro host on Amazon Linux 2023 running Nginx and the Node.js app. systemd restarts the app on crash and at boot.
Amazon S3	Private, SSE-S3 encrypted bucket (11 nines durability) holding /resumes/ and /reports/.
AWS IAM	Instance-profile role (EC2-ATS-Application-Role) scoped to one bucket with s3:PutObject, s3:GetObject, s3:ListBucket. No access keys stored; credentials rotate through IMDSv2.
Security Groups	Stateful firewall for inbound and outbound traffic.
Amazon CloudWatch	CPU, network and disk metrics, with an alarm when CPU stays above 80% for 5-minute periods.
Live Deployment
Property	Value
Instance name	ats_analyser
Instance ID	i-0d9c215eeafd34a68
Type and zone	t3.micro, us-east-1c
State	Running, 3/3 status checks passed
Public IPv4	54.226.121.91
URL	http://54.226.121.91/
Security Group Rules

Security group launch-wizard-1 has 4 inbound rules:

Port	Protocol	Purpose
22	SSH	Server administration
80	HTTP	Public web traffic to Nginx
443	HTTPS	Secure web traffic
5432	PostgreSQL	Database access
Nginx and systemd
Nginx listens on port 80 and proxies to Node.js at 127.0.0.1:3000.
client_max_body_size 15M for resume uploads; gzip enabled for text, CSS, JavaScript and JSON.
nginx -t passes and Nginx is enabled to start on boot.
Place aws-deployment/nginx.conf at /etc/nginx/conf.d/ats-app.conf.
Install aws-deployment/ats-app.service in /etc/systemd/system/ to manage the Node.js process with automatic restarts.
Quick Deployment Steps
Create a private S3 bucket (e.g., ats-resume-analysis-group-bucket).
Create the IAM role EC2-ATS-Application-Role with access to that bucket only.
Launch a t3.micro EC2 instance (Amazon Linux 2023) and attach the IAM role.
Configure the security group (ports 22, 80, 443).
Install Node.js and Nginx, copy the project, and apply nginx.conf and ats-app.service.
Enable and start both services, then browse to the instance public IP.

(aws-deployment/ec2-user-data.sh automates these steps through Cloud-Init.)

8. Security, Reliability and Cost
Area	Measures
Security	No hardcoded secrets (EC2 IAM role only); S3 objects encrypted with AES-256 (SSE-S3); policy limited to s3:PutObject, s3:GetObject, s3:ListBucket; uploads limited to .pdf, .docx, .txt and 10 MB
Reliability	systemd restarts Node.js within 5 seconds; Nginx buffers uploads from slow clients; local fallback keeps requests alive if S3 fails
Cost	$0 within the AWS Free Tier: EC2 750 hours/month, S3 5 GB storage with 20,000 GET and 2,000 PUT requests, up to 100 GB outbound transfer
9. REST API Endpoints
1. POST /api/analyze

Submits a resume document and job description for ATS evaluation.

Content-Type: multipart/form-data

Field	Type	Required	Description
resume	File	Yes	PDF, DOCX, or TXT file (up to 10 MB)
jobDescription	Text	Yes	Target job requirements
candidateName	Text	No	Candidate name override

Success Response (200 OK):

json
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
2. GET /api/health

Health check endpoint for AWS Application Load Balancer and CloudWatch.

json
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

Try it live: http://54.226.121.91/api/health

3. GET /api/history

Returns a list of recently analyzed resumes and scores.

4. GET /api/report/:id

Retrieves the full evaluation report JSON by report ID.

5. GET /api/samples

Retrieves pre-loaded sample job descriptions and test resumes.

10. Using the Web Application
Open http://54.226.121.91/.
Upload a PDF, DOCX or TXT resume (up to 10 MB), or pick a built-in high-score or low-score sample.
Paste a job description, or load the sample cloud engineer JD.
Optionally enter a candidate name (it is extracted automatically if left blank).
Click analyze to view the score dial, factor breakdown, and matched and missing keywords.
Earlier analyses are listed under Past Scans; the header shows whether S3 is configured.
11. Group Members and Responsibilities
Member	Roll No.	Responsibilities
Anubhab Anjan Kumar Malik (Student 1, Cloud & Infrastructure Lead)	B123022	AWS EC2, S3, IAM roles, Security Groups, Nginx reverse proxy, systemd deployment
Diyal Mandal (Student 2, Backend & AI Engine Lead)	B123055	Document parsers (PDF/DOCX), NLP tokenization, TF-IDF cosine similarity, weighted scoring engine, AWS SDK v3 integration
G Vanessa Reddy (Student 3, Frontend & Evaluation Lead)	B123058	UI dashboard, progress visualizations, empirical benchmarking, sample testing, video presentation
12. Future Enhancements
Serverless migration: Lambda functions behind API Gateway, scaling to zero when idle.
Asynchronous queue: SQS and EventBridge for bulk batch resume processing.
LLM feedback: Amazon Bedrock models that rewrite bullet points around missing keywords.
13. References
Live application: http://54.226.121.91/
Project presentation: ATS_Resume_Analyser_Cloud_Project.pptx
PROJECT_REPORT.md, AWS_DEPLOYMENT_GUIDE.md, VIDEO_PRESENTATION_SCRIPT.md
AWS documentation: Amazon EC2, Amazon S3, AWS IAM, Amazon CloudWatch, Security Groups
