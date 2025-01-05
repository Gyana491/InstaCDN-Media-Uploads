const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Compresses and saves an image file
 * @param {Buffer} buffer - The file buffer to compress
 * @param {string} filepath - The destination file path
 * @param {Object} options - Compression options
 * @returns {Promise<void>}
 */
async function compressImage(buffer, filepath, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 80,
        fit = 'inside',
        withoutEnlargement = true
    } = options;

    await sharp(buffer)
        .resize(maxWidth, maxHeight, {
            fit,
            withoutEnlargement
        })
        .jpeg({ quality })
        .toFile(filepath);
}

module.exports = {
    compressImage
}; 