const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Try to load AWS SDK for R2 (S3-compatible)
let S3Client, PutObjectCommand;
try {
  const s3Module = require('@aws-sdk/client-s3');
  S3Client = s3Module.S3Client;
  PutObjectCommand = s3Module.PutObjectCommand;
} catch (error) {
  console.log('AWS SDK not loaded - using local storage only');
}

// Configure multer for memory storage (we'll handle saving ourselves)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Simple auth middleware (same as patients.js)
const simpleAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = JSON.parse(atob(token));
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if R2 is configured
const isR2Configured = () => {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
};

// Create R2 client (lazy initialization)
let r2Client = null;
const getR2Client = () => {
  if (!r2Client && isR2Configured() && S3Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2Client;
};

// Ensure uploads directories exist for local storage
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const documentsDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Upload to R2
const uploadToR2 = async (file, filename) => {
  const client = getR2Client();
  if (!client) {
    throw new Error('R2 client not available');
  }

  const key = `profile-pictures/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await client.send(command);

  // Return the public URL
  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return publicUrl;
};

// Upload to local storage
const uploadToLocal = async (file, filename) => {
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);

  // Return relative URL that can be served by Express
  return `/uploads/profile-pictures/${filename}`;
};

// POST /api/upload/profile-picture
router.post('/profile-picture', simpleAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Generate unique filename
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${uuidv4()}${ext}`;

    let url;

    if (isR2Configured() && S3Client) {
      // Upload to Cloudflare R2
      console.log('Uploading to Cloudflare R2...');
      url = await uploadToR2(req.file, filename);
      console.log('Uploaded to R2:', url);
    } else {
      // Fall back to local storage
      console.log('R2 not configured, using local storage...');
      url = await uploadToLocal(req.file, filename);
      console.log('Saved locally:', url);
    }

    res.json({
      url,
      filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

// Configure multer for document uploads (images + PDFs)
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) and PDFs are allowed'), false);
    }
  }
});

// Upload document to R2
const uploadDocumentToR2 = async (file, filename) => {
  const client = getR2Client();
  if (!client) {
    throw new Error('R2 client not available');
  }

  const key = `documents/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await client.send(command);

  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  return publicUrl;
};

// Upload document to local storage
const uploadDocumentToLocal = async (file, filename) => {
  const filePath = path.join(documentsDir, filename);
  await fs.promises.writeFile(filePath, file.buffer);
  return `/uploads/documents/${filename}`;
};

// POST /api/upload/document
router.post('/document', simpleAuth, documentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const ext = path.extname(req.file.originalname) || '.pdf';
    const filename = `${uuidv4()}${ext}`;

    let url;

    if (isR2Configured() && S3Client) {
      console.log('Uploading document to Cloudflare R2...');
      url = await uploadDocumentToR2(req.file, filename);
      console.log('Uploaded document to R2:', url);
    } else {
      console.log('R2 not configured, using local storage for document...');
      url = await uploadDocumentToLocal(req.file, filename);
      console.log('Saved document locally:', url);
    }

    res.json({
      url,
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Error handler for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: error.message });
  }
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  next();
});

module.exports = router;
