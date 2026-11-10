# 10-Minute Video Presentation Script
## Cloud Computing Project: AI Resume Analysis and ATS Scoring Platform on AWS

**Format:** 10-minute recorded video demonstration  
**Team Structure:** 3 Students  
**Distribution:**
- **Student 1**: Introduction, Problem Statement, Objectives, Cloud Architecture & AWS Services (0:00 - 3:20)
- **Student 2**: Technical Implementation, NLP & ATS Scoring Engine, S3 & EC2 Integration (3:20 - 6:40)
- **Student 3**: Live System Demonstration, Results Comparison, Cloud Console Verification & Conclusion (6:40 - 10:00)

---

## Video Outline and Timing Schedule

| Segment | Duration | Speaker | Core Topic |
| :--- | :--- | :--- | :--- |
| **Slide 1 - 3** | 0:00 - 1:15 | Student 1 | Title, Team Introductions, Problem Statement |
| **Slide 4 - 5** | 1:15 - 2:20 | Student 1 | Project Objectives, Cloud Requirements |
| **Slide 6 - 7** | 2:20 - 3:20 | Student 1 | AWS System Architecture & Cloud Services (EC2, S3, IAM, CloudWatch) |
| **Slide 8 - 9** | 3:20 - 4:40 | Student 2 | Document Parsing & NLP Engine (PDF/DOCX, Tokenization, Skills Taxonomy) |
| **Slide 10 - 11** | 4:40 - 5:45 | Student 2 | TF-IDF Cosine Similarity & Weighted ATS Scoring Formula |
| **Slide 12** | 5:45 - 6:40 | Student 2 | AWS S3 Integration & Resilient Local Fallback Architecture |
| **Screen Demo 1** | 6:40 - 7:55 | Student 3 | Live Demo: High-Scoring Cloud Engineer Resume Evaluation |
| **Screen Demo 2** | 7:55 - 8:50 | Student 3 | Live Demo: Poorly Formatted Resume Contrast & Diagnostics |
| **Screen Demo 3** | 8:50 - 9:30 | Student 3 | AWS Console Verification (S3 Bucket Files, EC2 Health Endpoint) |
| **Slide 13 - 14** | 9:30 - 10:00 | Student 3 | Performance Summary, Future Work & Conclusion |

---

## Detailed Minute-by-Minute Script

### Part 1: Architecture, Problem Statement and Cloud Infrastructure
**Speaker:** Student 1 (Time: 0:00 to 3:20)

**[0:00 - 0:40] Slide 1: Title and Introductions**
- **Visual:** Title Slide showing project name ("Cloud-Native AI Resume Analysis and ATS Scoring Platform"), Course Name, Group Member Names (Student 1, Student 2, Student 3).
- **Speaking Script:**
  > "Good day everyone. Welcome to our final project presentation for Cloud Computing. Today, my team members and I will present our project: a Cloud-Native AI Resume Analysis and ATS Scoring Platform deployed on Amazon Web Services.
  >
  > I am Student 1, responsible for the cloud infrastructure and architecture design. Joining me today are Student 2, who led our backend and NLP algorithm development, and Student 3, who directed our frontend interface, experimental evaluation, and live demonstration."

**[0:40 - 1:30] Slide 2 & 3: Problem Statement and Motivation**
- **Visual:** Graphic showing the recruitment funnel: 1,000+ applicants reduced to top 5% by automated ATS systems.
- **Speaking Script:**
  > "Over 75% of large enterprises utilize Applicant Tracking Systems, or ATS, to automatically screen and filter job applicants before human recruiters ever read a single word.
  >
  > However, qualified candidates often get automatically rejected due to non-standard resume formats, keyword terminology mismatches, missing quantifiable metrics, or complex table layouts that standard parsers fail to process.
  >
  > From an infrastructure perspective, analyzing large volumes of unstructured documents like PDFs and DOCX files demands scalable compute power, secure and durable object storage, and strict least-privilege security. Our project addresses this challenge with a high-performance, cost-effective solution built on AWS."

**[1:30 - 2:30] Slide 4 & 5: Project Objectives and Scope**
- **Visual:** Bullet points highlighting the 4 main goals: Document Ingestion, NLP Scoring Model, AWS Cloud Integration, and Sub-500ms Real-Time Feedback.
- **Speaking Script:**
  > "Our primary objectives were four-fold:
  > First, to build an automated ingestion engine supporting PDF, DOCX, and text formats.
  > Second, to develop a comprehensive ATS scoring engine utilizing Natural Language Processing, TF-IDF cosine similarity, and a taxonomy of over 500 technical skills.
  > Third, to deploy this entire architecture natively on AWS public cloud infrastructure using Amazon EC2, Amazon S3, and AWS IAM without storing any hardcoded credentials.
  > And fourth, to deliver an accessible, real-time web dashboard that gives candidates immediate, actionable feedback to optimize their resumes."

**[2:30 - 3:20] Slide 6 & 7: AWS Cloud System Architecture**
- **Visual:** System Architecture Diagram showing Client Browser -> AWS Security Group -> Nginx Reverse Proxy -> Node.js Express on EC2 -> Amazon S3 (Resumes & Reports) + Amazon CloudWatch.
- **Speaking Script:**
  > "Let us look at our cloud architecture. We designed a clean, 3-tier architecture on Amazon Web Services.
  >
  > In the compute tier, we provision an Amazon EC2 instance running Amazon Linux 2023. An Nginx reverse proxy handles client traffic on port 80, applies gzip compression, enforces a 15MB file upload limit, and proxies requests to our Node.js service running under Linux systemd on internal port 3000.
  >
  > In the storage tier, we integrate Amazon S3 for durable, encrypted object storage. Uploaded resumes are securely deposited in the resumes directory, and generated analysis reports are archived in the reports directory.
  >
  > Crucially, our EC2 instance communicates with Amazon S3 through an AWS IAM Role. This means zero access keys or secrets are embedded in our source code. Telemetry and instance health are continuously tracked via Amazon CloudWatch.
  >
  > I will now pass the presentation to Student 2 to explain the technical implementation and scoring algorithms."

---

### Part 2: Technical Implementation & ATS Scoring Algorithm
**Speaker:** Student 2 (Time: 3:20 to 6:40)

**[3:20 - 4:20] Slide 8 & 9: Ingestion Engine and Skills Taxonomy**
- **Visual:** Code snippets of `lib/parser.js` and `lib/skillsDatabase.js`.
- **Speaking Script:**
  > "Thank you, Student 1. I will now walk through our core engine implementation.
  >
  > The pipeline begins with document ingestion in `parser.js`. We use `pdf-parse` for PDF stream extraction and `mammoth` for DOCX files. Our text normalization pipeline cleans up carriage returns and excessive whitespace while preserving the structural line breaks required for section parsing.
  >
  > Next, our skills knowledge base in `skillsDatabase.js` contains a structured taxonomy of over 500 categorized technical competencies, spanning programming languages, frontend and backend frameworks, cloud and virtualization platforms, databases, DevOps tools, and AI/ML libraries.
  >
  > By applying token boundary regex matching, our system avoids false positives—such as mistaking the letter 'C' in the word 'Cloud' for the C programming language."

**[4:20 - 5:35] Slide 10 & 11: NLP Processing and Multi-Factor ATS Scoring Formula**
- **Visual:** Mathematical formulas for TF-IDF Cosine Similarity and the Weighted Composite ATS Score formula.
- **Speaking Script:**
  > "To evaluate how well a resume fits a specific job, we implemented a multi-factor scoring algorithm.
  >
  > First, we calculate Required Skill Match, which carries a 35% weight, measuring what percentage of job description requirements the candidate possesses.
  >
  > Second, we measure Semantic and Content Relevance, which carries a 25% weight. Here, we compute the Term Frequency of both documents, filter out stop words, and calculate the Cosine Similarity between their normalized vector spaces. This captures vocabulary alignment and topical depth.
  >
  > Third, we evaluate Quantifiable Impact and Action Verbs with a 20% weight. Real-world ATS systems prioritize bullet points that start with strong verbs like 'architected' or 'streamlined', and contain measurable data points such as percentages, dollar savings, or latency reductions.
  >
  > Fourth, we check ATS Formatting and Section Compliance with a 20% weight, ensuring essential sections like Contact Information, Work Experience, Education, and Skills are clearly identifiable.
  >
  > Combining these dimensions yields a composite ATS score from 0 to 100."

**[5:35 - 6:40] Slide 12: AWS S3 Service Layer & Fault-Tolerant Local Fallback**
- **Visual:** Architecture snippet of `lib/s3Service.js` showing AWS SDK v3 `PutObjectCommand` and the local fallback mechanism.
- **Speaking Script:**
  > "For cloud storage, we use the official AWS SDK version 3 `@aws-sdk/client-s3`.
  >
  > When running in production on AWS, the service uploads the original document and persists the complete evaluation JSON report into our private Amazon S3 bucket using server-side encryption.
  >
  > To ensure high resilience, our code includes an automatic fallback. If the application is run in an offline development environment without AWS credentials, it smoothly redirects storage to local disk folders without failing.
  >
  > Furthermore, we implemented an `/api/health` endpoint that returns real-time JSON diagnostics on memory usage, uptime, and AWS S3 bucket connectivity. This endpoint integrates directly with AWS Application Load Balancer health checks.
  >
  > Now, Student 3 will present our live demonstration and experimental results."

---

### Part 3: Live Demonstration, Results Comparison & Conclusion
**Speaker:** Student 3 (Time: 6:40 to 10:00)

**[6:40 - 7:55] Screen Demo 1: High-Scoring Cloud Engineer Resume**
- **Visual:** Switch to live screen recording of the web application in browser (`http://<EC2-PUBLIC-IP>`).
- **Speaking Script:**
  > "Thank you, Student 2. I am now demonstrating our live web application running directly on our AWS EC2 instance.
  >
  > In the top navbar, you can see our real-time status indicator displaying 'Online: AWS S3 Connected'.
  >
  > Let us load our sample Cloud Infrastructure and DevOps Engineer job description. This requires expertise in AWS, EC2, S3, Docker, Kubernetes, Terraform, CI/CD, and Nginx.
  >
  > Now, let us load our well-formatted candidate resume for Alex Morgan and click 'Analyze and Compute ATS Score'.
  >
  > Within less than half a second, the server processes the document and returns a detailed report. Notice our overall score: 72 out of 100, categorized as a 'Good Match'.
  >
  > Looking at the breakdown bars:
  > - Required Skills Match scored 69 out of 100, identifying 25 matched technologies like AWS, Docker, Terraform, and Kubernetes.
  > - Quantifiable Impact scored 90 out of 100, successfully extracting key business metrics such as 'reducing costs by 32%' and 'decreasing release cycle times by 45%'.
  > - Structural Compliance achieved 93 out of 100 with all contact links verified.
  > - The dashboard also provides targeted recommendations to further optimize keyword alignment."

**[7:55 - 8:50] Screen Demo 2: Poorly Formatted Resume Contrast**
- **Visual:** Uploading `sample_resume_poor.txt` against the same job description and running analysis.
- **Speaking Script:**
  > "To verify that our ATS algorithm accurately filters unqualified applicants, let us now test an unformatted, vague resume for John Doe.
  >
  > We click 'Analyze'. As you can see, the overall score drops to 6 out of 100, rated as a 'Poor Match'.
  >
  > The system immediately flags 35 missing critical skills, registers 0 out of 100 for Quantifiable Impact due to lack of metrics, and detects missing contact details.
  >
  > The recommendation engine produces 6 high-priority corrective actions, telling the applicant exactly how to restructure their document."

**[8:50 - 9:30] Screen Demo 3: AWS Console Verification**
- **Visual:** Switch to AWS Management Console in browser: Amazon S3 bucket view showing files in `resumes/` and `reports/`, then EC2 instance status checks.
- **Speaking Script:**
  > "Let us now verify the cloud operations inside the AWS Management Console.
  >
  > Here is our Amazon S3 bucket. If we open the `resumes` directory, we see the uploaded resume files stored with sanitized timestamp identifiers.
  >
  > Opening the `reports` directory, we find the corresponding JSON evaluation outputs.
  >
  > Over in the EC2 Console, our instance shows two-of-two status checks passed, and CloudWatch metrics confirm our average CPU utilization remains under 5%, demonstrating excellent resource efficiency."

**[9:30 - 10:00] Slide 13 & 14: Conclusion and Future Work**
- **Visual:** Summary slide showing project milestones achieved, Free Tier zero cost verification, and future enhancements (Serverless AWS Lambda, Amazon Bedrock GenAI).
- **Speaking Script:**
  > "In conclusion, our team successfully built and deployed a production-grade AI ATS Resume Analyzer on public cloud infrastructure. We leveraged Amazon EC2, Amazon S3, AWS IAM, and Nginx to achieve sub-500ms response times with enterprise-grade security and zero monthly hosting costs under the AWS Free Tier.
  >
  > For future work, we plan to modularize the backend into serverless AWS Lambda functions and incorporate Amazon Bedrock for generative bullet point rewriting.
  >
  > Thank you for your time. We are now ready to answer any questions."

---

## Technical Setup Instructions for Recording the Video

1. **Screen Resolution**: Set recording resolution to 1080p (1920x1080) at 30 or 60 fps.
2. **Audio Check**: Ensure all 3 students test microphone levels before recording to avoid volume fluctuations between segments.
3. **Screen Recording Tool**: Use OBS Studio, Zoom, or Google Meet with screen sharing enabled.
4. **Demonstration Preparation**:
   - Ensure the EC2 instance is running and Nginx is active.
   - Have the web interface loaded in one tab (`http://<EC2-PUBLIC-IP>`).
   - Have the AWS S3 Console and EC2 Console open in adjacent tabs.
   - Practice the transitions between Student 1, Student 2, and Student 3 to keep total video runtime strictly under 10 minutes.
