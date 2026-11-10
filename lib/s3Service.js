/**
 * Storage Service Module
 * Handles AWS S3 Object Storage integration with graceful local filesystem fallback.
 * Uses AWS SDK v3 @aws-sdk/client-s3
 */

const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand
} = require('@aws-sdk/client-s3');

const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const LOCAL_REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Ensure local directories exist
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(LOCAL_REPORTS_DIR)) fs.mkdirSync(LOCAL_REPORTS_DIR, { recursive: true });

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';

let s3Client = null;
let isS3Enabled = false;

// Initialize S3 client if AWS credentials or IAM role environment is available
try {
  if (AWS_BUCKET_NAME) {
    const s3Config = { region: AWS_REGION };

    // If explicit credentials exist in environment, use them. Otherwise, default credentials provider
    // chain will automatically resolve IAM Role on AWS EC2 / ECS.
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }

    s3Client = new S3Client(s3Config);
    isS3Enabled = true;
    console.log(`[Storage] Initialized AWS S3 client targeting bucket "${AWS_BUCKET_NAME}" in region "${AWS_REGION}".`);
  } else {
    console.log('[Storage] AWS_BUCKET_NAME not set. Using local disk fallback storage (./uploads and ./reports).');
  }
} catch (err) {
  console.warn('[Storage] Could not initialize AWS S3 client, defaulting to local storage:', err.message);
  isS3Enabled = false;
}

/**
 * Save resume file to S3 or local directory
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Target filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<{storageType: string, location: string}>}
 */
async function storeResumeFile(buffer, filename, mimeType) {
  const sanitizedFilename = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  if (isS3Enabled && s3Client) {
    try {
      const s3Key = `resumes/${sanitizedFilename}`;
      const command = new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream'
      });

      await s3Client.send(command);
      const s3Uri = `s3://${AWS_BUCKET_NAME}/${s3Key}`;
      console.log(`[Storage] Successfully uploaded resume to AWS S3: ${s3Uri}`);
      return {
        storageType: 'AWS_S3',
        location: s3Uri,
        filename: sanitizedFilename
      };
    } catch (err) {
      console.warn(`[Storage] S3 upload failed (${err.message}). Falling back to local storage.`);
    }
  }

  // Local storage fallback
  const localPath = path.join(LOCAL_UPLOADS_DIR, sanitizedFilename);
  fs.writeFileSync(localPath, buffer);
  console.log(`[Storage] Saved resume locally: ${localPath}`);
  return {
    storageType: 'LOCAL_DISK',
    location: localPath,
    filename: sanitizedFilename
  };
}

/**
 * Persist generated ATS Analysis JSON Report to S3 or local disk
 * @param {string} reportId - Unique report identifier
 * @param {object} reportData - Full JSON report
 * @returns {Promise<{storageType: string, location: string}>}
 */
async function saveAnalysisReport(reportId, reportData) {
  const jsonString = JSON.stringify(reportData, null, 2);
  const reportKey = `${reportId}.json`;

  if (isS3Enabled && s3Client) {
    try {
      const s3Key = `reports/${reportKey}`;
      const command = new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: s3Key,
        Body: Buffer.from(jsonString),
        ContentType: 'application/json'
      });

      await s3Client.send(command);
      const s3Uri = `s3://${AWS_BUCKET_NAME}/${s3Key}`;
      console.log(`[Storage] Stored ATS report in AWS S3: ${s3Uri}`);

      // Also cache locally for fast read access
      const localPath = path.join(LOCAL_REPORTS_DIR, reportKey);
      fs.writeFileSync(localPath, jsonString);

      return {
        storageType: 'AWS_S3',
        location: s3Uri,
        reportId
      };
    } catch (err) {
      console.warn(`[Storage] S3 report upload failed (${err.message}). Storing locally.`);
    }
  }

  // Local storage fallback
  const localPath = path.join(LOCAL_REPORTS_DIR, reportKey);
  fs.writeFileSync(localPath, jsonString);
  console.log(`[Storage] Stored ATS report locally: ${localPath}`);
  return {
    storageType: 'LOCAL_DISK',
    location: localPath,
    reportId
  };
}

/**
 * Retrieve analysis report by ID
 * @param {string} reportId - Unique report identifier
 * @returns {Promise<object|null>}
 */
async function getAnalysisReport(reportId) {
  const reportKey = `${reportId}.json`;
  const localPath = path.join(LOCAL_REPORTS_DIR, reportKey);

  // Check local disk first
  if (fs.existsSync(localPath)) {
    try {
      const data = fs.readFileSync(localPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`[Storage] Error reading local report ${localPath}:`, e.message);
    }
  }

  // If not local and S3 is enabled, fetch from S3
  if (isS3Enabled && s3Client) {
    try {
      const command = new GetObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: `reports/${reportKey}`
      });
      const response = await s3Client.send(command);
      const streamToString = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
      const bodyString = await streamToString(response.Body);
      return JSON.parse(bodyString);
    } catch (err) {
      console.warn(`[Storage] Report not found in S3: ${reportKey}`);
    }
  }

  return null;
}

/**
 * List recent reports from local cache
 * @param {number} limit
 * @returns {Array<object>}
 */
function listRecentReports(limit = 10) {
  try {
    const files = fs.readdirSync(LOCAL_REPORTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(file => {
        const filePath = path.join(LOCAL_REPORTS_DIR, file);
        const stats = fs.statSync(filePath);
        return { file, mtime: stats.mtimeMs, filePath };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    const summaries = [];
    files.forEach(f => {
      try {
        const content = JSON.parse(fs.readFileSync(f.filePath, 'utf8'));
        summaries.push({
          reportId: content.reportId || path.basename(f.file, '.json'),
          candidateName: content.contactInfo ? content.contactInfo.candidateName : 'Candidate',
          overallScore: content.overallScore,
          ratingLevel: content.ratingLevel,
          ratingColor: content.ratingColor,
          analyzedAt: content.meta ? content.meta.analyzedAt : new Date(f.mtime).toISOString(),
          originalFilename: content.meta ? content.meta.originalFilename : f.file
        });
      } catch (err) {
        // Skip malformed files
      }
    });

    return summaries;
  } catch (err) {
    console.error('[Storage] Error listing recent reports:', err.message);
    return [];
  }
}

/**
 * Health status of storage system
 */
async function checkStorageStatus() {
  const status = {
    configuredType: isS3Enabled ? 'AWS_S3' : 'LOCAL_DISK',
    bucketName: AWS_BUCKET_NAME || 'Not Configured',
    region: AWS_REGION,
    isS3Healthy: false,
    localUploadsDirectory: LOCAL_UPLOADS_DIR,
    localReportsDirectory: LOCAL_REPORTS_DIR
  };

  if (isS3Enabled && s3Client) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: AWS_BUCKET_NAME }));
      status.isS3Healthy = true;
    } catch (err) {
      status.isS3Healthy = false;
      status.s3Error = err.message;
    }
  }

  return status;
}

module.exports = {
  storeResumeFile,
  saveAnalysisReport,
  getAnalysisReport,
  listRecentReports,
  checkStorageStatus
};
