const cloudinary = require('../config/cloudinary');

/**
 * Uploads an in-memory file buffer (from multer's memoryStorage) to Cloudinary.
 * Used instead of local disk storage because Render's filesystem is ephemeral —
 * anything written to disk is wiped on every restart/redeploy.
 *
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} folder - Cloudinary folder, e.g. 'campusbite/vendors'
 * @returns {Promise<string>} secure_url of the uploaded asset
 */
async function uploadBufferToCloudinary(buffer, mimetype, folder) {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'auto', // handles images and PDFs (verification documents)
  });
  return result.secure_url;
}

module.exports = { uploadBufferToCloudinary };
