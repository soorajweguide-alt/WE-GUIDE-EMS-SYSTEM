const fs = require('fs');
const path = require('path');
const { generateQRCodeBase64 } = require('./utils/qrGenerator');

const dbPath = path.join(__dirname, 'database', 'weguide.json');

async function migrate() {
  if (!fs.existsSync(dbPath)) return;
  const dbStr = fs.readFileSync(dbPath, 'utf8');
  const dbData = JSON.parse(dbStr);

  for (const emp of dbData.employees) {
    console.log(`Updating QR for ${emp.employee_id}...`);
    emp.qr_data = await generateQRCodeBase64(emp.profile_url);
  }

  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
  console.log('Done migrating QR codes!');
}

migrate();
