const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 PNG data URL.
 */
async function generateQRCodeBase64(data) {
  const opts = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    width: 400,
  };
  return await QRCode.toDataURL(data, opts);
}

/**
 * Generate a QR code as an SVG string.
 */
async function generateQRCodeSVG(data) {
  const opts = {
    errorCorrectionLevel: 'H',
    type: 'svg',
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    width: 400,
  };
  return await QRCode.toString(data, opts);
}

module.exports = { generateQRCodeBase64, generateQRCodeSVG };
