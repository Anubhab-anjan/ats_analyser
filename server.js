/**
 * Cloud Computing Project: AI Resume Analysis & ATS Scoring System
 * Production-ready Express application deployed on AWS (EC2 / S3 / IAM / CloudWatch).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { parseResumeDocument } = require('./lib/parser');
const { evaluateResume } = require('./lib/atsScorer');
const {
  storeResumeFile,
  saveAnalysisReport,
  getAnalysisReport,
  listRecentReports,
  checkStorageStatus
} = require('./lib/s3Service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer for file upload in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are supported.'));
    }
  }
});

/**
 * Health check endpoint for AWS Application Load Balancer and CloudWatch synthetic monitors
 */
app.get('/api/health', async (req, res) => {
  const storageStatus = await checkStorageStatus();
  res.status(200).json({
    status: 'healthy',
    service: 'ai-ats-resume-analyzer',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    cloudProvider: 'Amazon Web Services (AWS)',
    storage: storageStatus,
    memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024))
  });
});

/**
 * Main Resume Analysis & ATS Scoring endpoint
 */
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  const startTime = Date.now();

  try {
    const { jobDescription, candidateName } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Resume document is required. Please upload a PDF, DOCX, or TXT file.'
      });
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: 'Job description text is required (minimum 20 characters) to perform ATS comparison.'
      });
    }

    // 1. Extract text from uploaded document
    const parsedDoc = await parseResumeDocument(req.file.buffer, req.file.originalname);

    if (!parsedDoc.text || parsedDoc.text.trim().length < 50) {
      return res.status(422).json({
        success: false,
        error: 'The uploaded document contains insufficient or unreadable text. Please ensure the document is not an image-only scan.'
      });
    }

    // 2. Perform AI ATS evaluation
    const reportId = crypto.randomUUID();
    const evaluation = evaluateResume(parsedDoc.text, jobDescription, {
      reportId,
      originalFilename: req.file.originalname,
      fileSizeBytes: req.file.size,
      format: parsedDoc.format,
      pageCount: parsedDoc.pageCount,
      wordCount: parsedDoc.wordCount
    });

    if (candidateName && candidateName.trim()) {
      evaluation.contactInfo.candidateName = candidateName.trim();
    }

    // 3. Store uploaded resume file to AWS S3 (or local fallback)
    const storedFile = await storeResumeFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    // 4. Attach storage metadata to report
    evaluation.storage = {
      fileStorageType: storedFile.storageType,
      fileLocation: storedFile.location,
      bucket: process.env.AWS_BUCKET_NAME || 'local'
    };
    evaluation.processingTimeMs = Date.now() - startTime;
    evaluation.reportId = reportId;

    // 5. Persist JSON analysis report to AWS S3 / Local storage
    await saveAnalysisReport(reportId, evaluation);

    return res.status(200).json({
      success: true,
      reportId: reportId,
      data: evaluation
    });
  } catch (error) {
    console.error('[Server] Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An internal error occurred while analyzing the resume.'
    });
  }
});

/**
 * Retrieve previous analysis report by ID
 */
app.get('/api/report/:id', async (req, res) => {
  try {
    const report = await getAnalysisReport(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.status(200).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Retrieve recent scans history
 */
app.get('/api/history', (req, res) => {
  try {
    const history = listRecentReports(15);
    res.status(200).json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Sample pre-loaded job descriptions and resumes for testing
 */
app.get('/api/samples', (req, res) => {
  try {
    const sampleJdPath = path.join(__dirname, 'sample-data', 'sample_job_description.txt');
    const sampleResumePath = path.join(__dirname, 'sample-data', 'sample_resume.txt');
    const samplePoorResumePath = path.join(__dirname, 'sample-data', 'sample_resume_poor.txt');

    const jobDescription = fs.existsSync(sampleJdPath) ? fs.readFileSync(sampleJdPath, 'utf8') : '';
    const strongResume = fs.existsSync(sampleResumePath) ? fs.readFileSync(sampleResumePath, 'utf8') : '';
    const poorResume = fs.existsSync(samplePoorResumePath) ? fs.readFileSync(samplePoorResumePath, 'utf8') : '';

    res.status(200).json({
      success: true,
      jobDescriptions: {
        cloudEngineer: jobDescription
      },
      resumes: {
        strongCloudResume: strongResume,
        poorResume: poorResume
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Global error handling middleware for Multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds maximum permitted limit (10 MB).'
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
  next();
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================================`);
  console.log(`Cloud AI ATS Resume Analyzer Service`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
  console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`AWS Bucket: ${process.env.AWS_BUCKET_NAME || 'Local Fallback'}`);
  console.log(`========================================================`);
});
