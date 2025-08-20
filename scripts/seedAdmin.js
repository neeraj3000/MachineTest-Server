const path = require('path');
const dotenv = require('dotenv');
const { connectToDatabase } = require('../src/utils/db');
const User = require('../src/models/User');

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

async function main() {
  await connectToDatabase();
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    mobile: process.env.ADMIN_MOBILE || '+10000000000',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'ADMIN'
  });
  console.log('Admin created:', admin.email);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
