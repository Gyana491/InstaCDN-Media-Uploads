const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { compressImage } = require("../utils/imageCompression");
require("dotenv").config();

const router = express.Router();

// Configure multer for memory storage instead of disk
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage
}).array('files', 10);


// Add this near the top of the file, after the imports
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists with proper permissions
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
}

// Handle file upload
router.post('/upload', (req, res) => {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: 'File size too large. Maximum size is 50MB per file.' 
                });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: 'Upload failed: ' + err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const uploadedFiles = [];

            await Promise.all(req.files.map(async (file) => {
                try {
                    const now = new Date();
                    const timestamp = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
                    const sanitizedOriginalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filename = `${sanitizedOriginalname}-${timestamp}`;
                    const filepath = path.join(uploadDir, filename);

                    const isImage = file.mimetype.startsWith('image/');
                    
                    if (isImage) {
                        await compressImage(file.buffer, filepath);
                    } else {
                        await fs.promises.writeFile(filepath, file.buffer);
                    }

                    uploadedFiles.push({
                        filename: filename,
                        path: `/uploads/${filename}`,
                        url: `${process.env.HOST}/uploads/${filename}`,
                        size: file.size,
                        mimetype: file.mimetype
                    });
                } catch (err) {
                    console.error(`Error processing file ${file.originalname}:`, err);
                }
            }));

            if (uploadedFiles.length === 0) {
                return res.status(500).json({ error: 'Failed to process any of the uploaded files' });
            }

            res.json({ 
                message: `Successfully processed ${uploadedFiles.length} of ${req.files.length} files`,
                files: uploadedFiles
            });
        } catch (error) {
            console.error('Upload processing error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

// Get files with pagination
router.get('/files', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const uploadDir = 'uploads/';

        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                return res.status(500).json({ error: 'Error reading files' });
            }

            const fileStats = files.map(filename => {
                const filePath = path.join(uploadDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    url: `/uploads/${filename}`,
                    size: stats.size,
                    uploadDate: stats.mtime,
                    mimetype: path.extname(filename)
                };
            }).sort((a, b) => b.uploadDate - a.uploadDate);

            const totalFiles = fileStats.length;
            const totalPages = Math.ceil(totalFiles / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            res.json({
                files: fileStats.slice(startIndex, endIndex),
                currentPage: page,
                totalPages,
                totalFiles
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
