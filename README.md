# ats_analyser — Cloud-Native AI Resume Analysis & ATS Scoring Platform

A 7th-semester Cloud Computing project: a resume analysis and ATS scoring platform hosted on Amazon EC2 behind an Nginx reverse proxy, with a Node.js/Express backend and Amazon S3 storage secured through an IAM role.

**Live website:** http://54.226.121.91/

## Features

- Upload PDF, DOCX or TXT resumes (up to 10 MB) and paste or load a job description.
- Overall ATS score from 0 to 100 with a rating level and recommendations.
- Four-factor breakdown: required skills, semantic relevance, impact and action verbs, structure.
- Matched and missing skills shown against a 500+ term skills taxonomy.
- TF-IDF cosine similarity between the resume and the job description.
- Built-in strong and weak sample resumes and a sample cloud engineer job description.
- Past Scans history and a `/api/health` endpoint for monitoring.
- Automatic fallback to local disk storage if S3 is unreachable.
- Responsive HTML/CSS interface.

## Scoring model

`S = 0.35 · Skills + 0.25 · Semantic + 0.20 · Impact + 0.20 · Structure`

| Factor | Weight | How it is computed |
| --- | --- | --- |
| Required skills | 35% | Matched job-description skills ÷ required skills × 100 |
| Semantic relevance | 25% | TF-IDF cosine similarity scaled to 0–100 |
| Impact and action verbs | 20% | Harmonic mean of action-verb diversity (70+ verbs) and metric count |
| Structure | 20% | Contact info, standard sections, 300–1,200 words |

Sample results on the same job description: strong resume (Alex Morgan) **72 / 100**, weak resume (John Doe) **6 / 100**. Average end-to-end API response: **477 ms (±45 ms)**.

## AWS architecture

| Component | Confirmed configuration |
| --- | --- |
| Compute | Amazon EC2, instance `ats_analyser` (`i-0d9c215eeafd34a68`) |
| Instance type and zone | t3.micro, us-east-1c |
| Operating system | Amazon Linux 2023 |
| Public IPv4 | 54.226.121.91 |
| Web server | Nginx reverse proxy on port 80 forwarding to `127.0.0.1:3000` |
| Backend | Node.js / Express managed by systemd (`ats-app.service`) |
| Storage | Private Amazon S3 bucket, SSE-S3 (AES-256) encryption, `/resumes/` and `/reports/` prefixes |
| Identity | AWS IAM instance-profile role with `s3:PutObject`, `s3:GetObject`, `s3:ListBucket` on one bucket |
| Firewall | Security group `launch-wizard-1`: ports 22, 80, 443 and 5432 |
| Monitoring | Amazon CloudWatch, CPU alarm above 80% |
| SDK | AWS SDK for JavaScript v3 |

## Repository structure

```
ai_analysis/
├── server.js                  # Express server, REST endpoints, Multer upload, S3 integration
├── package.json
├── .env.example
├── lib/
│   ├── parser.js              # PDF, DOCX, TXT parsing
│   ├── nlpEngine.js           # Tokenization, TF-IDF, cosine similarity
│   ├── skillsDatabase.js      # 500+ skills and action verbs
│   ├── atsScorer.js           # Weighted ATS scoring
│   └── s3Service.js           # S3 integration with local fallback
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── sample-data/
│   ├── sample_resume.txt
│   ├── sample_resume_poor.txt
│   └── sample_job_description.txt
├── aws-deployment/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   ├── ats-app.service
│   └── ec2-user-data.sh
├── uploads/                   # Local fallback storage for resumes
├── reports/                   # Local fallback storage for JSON reports
├── .gitignore
└── README.md
```

## Run locally

1. Clone the repository: `git clone <YOUR_REPOSITORY_URL>`
2. Install dependencies (Node.js 18.x or 20.x LTS, npm 9+): `npm install`
3. Copy `.env.example` to `.env` (optional):
   ```env
   PORT=3000
   NODE_ENV=development
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=
   ```
   If `AWS_BUCKET_NAME` is empty, the app stores files in `./uploads` and `./reports`.
4. Start the app: `npm start`
5. Open `http://localhost:3000`

**Docker:**
```bash
docker build -t ats-analyzer -f aws-deployment/Dockerfile .
docker run -d -p 3000:3000 --name ats_app ats-analyzer
curl http://localhost:3000/api/health
```

## Deployment overview

1. Create a private S3 bucket (for example `ats-resume-analysis-group-bucket`) with SSE-S3 encryption.
2. Create the IAM role `EC2-ATS-Application-Role` with `PutObject`, `GetObject` and `ListBucket` on that bucket only.
3. Launch a t3.micro Amazon Linux 2023 EC2 instance and attach the IAM role.
4. Configure the security group for SSH (22), HTTP (80) and HTTPS (443).
5. Install Node.js and Nginx, copy the project, and set `AWS_BUCKET_NAME` and `AWS_REGION`.
6. Place `aws-deployment/nginx.conf` at `/etc/nginx/conf.d/ats-app.conf` (15 MB upload limit, gzip enabled) and run `nginx -t`.
7. Install `aws-deployment/ats-app.service` in `/etc/systemd/system/`, then enable and start it and Nginx.
8. Create a CloudWatch alarm for CPU above 80%.

`aws-deployment/ec2-user-data.sh` automates the provisioning through Cloud-Init. See `AWS_DEPLOYMENT_GUIDE.md` for more detail.

## REST API

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/analyze` | Multipart upload: `resume` (file), `jobDescription` (text), optional `candidateName`. Returns the score, breakdown, skills analysis and storage location. |
| GET | `/api/health` | Health check with uptime and S3 status. |
| GET | `/api/history` | Recently analyzed resumes and scores. |
| GET | `/api/report/:id` | Full report JSON by report ID. |
| GET | `/api/samples` | Sample job descriptions and test resumes. |

## Important notes

- The application has no user authentication. Do not upload sensitive personal documents.
- The site is served over HTTP on the EC2 public IP. Add a domain and an HTTPS certificate (or CloudFront) if HTTPS is required.
- The security group currently also allows port 5432 (PostgreSQL), which this app does not use. Consider removing that rule, and restrict SSH (22) to your own IP.
- Uploads are limited to `.pdf`, `.docx` and `.txt` files up to 10 MB.
- Never commit AWS credentials, secret keys, passwords or tokens. The app uses the EC2 IAM role instead of access keys.
- Everything runs within the AWS Free Tier (EC2 750 hours per month, S3 5 GB).
- Future work: Lambda and API Gateway migration, SQS/EventBridge batch processing, Amazon Bedrock bullet-point rewriting.

## Team

| Name | Roll No. | Role and contributions |
| --- | --- | --- |
| Anubhab Anjan Kumar Malik | B123022 | Cloud & Infrastructure Lead: AWS EC2, S3, IAM roles, Security Groups, Nginx reverse proxy, systemd deployment |
| Diyal Mandal | B123055 | Backend & AI Engine Lead: PDF/DOCX parsers, NLP tokenization, TF-IDF cosine similarity, weighted scoring engine, AWS SDK v3 integration |
| G Vanessa Reddy | B123058 | Frontend & Evaluation Lead: UI dashboard, progress visualizations, benchmarking, sample testing, video presentation |

## Project links

- **Live website:** http://54.226.121.91/
- **Video presentation and project report:** https://drive.google.com/drive/folders/1GafRWxoB_t808R6ddWbOxmfORSIuih_b

**Course:** Cloud Computing · **Semester:** 7th · **Cloud provider:** AWS
