const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a cryptographically secure token for QR/attendance use.
 * Format: UUID v4 + HMAC suffix for extra security
 */
function generateSecureToken() {
  const base = uuidv4();
  const hmac = crypto.createHmac('sha256', process.env.JWT_SECRET || 'weguide_secret');
  hmac.update(base);
  const suffix = hmac.digest('hex').substring(0, 8);
  return `${base}-${suffix}`;
}

/**
 * Build the JSON payload that goes into the QR code image.
 * This keeps the public URL clean while embedding the secure token.
 */
function buildQrPayload(secureToken, publicProfileUrl) {
  // Return just the URL so that native phone cameras automatically open it in the browser
  return publicProfileUrl;
}

module.exports = { generateSecureToken, buildQrPayload };
