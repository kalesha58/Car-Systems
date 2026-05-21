/**
 * Upload client logo for login greeting push notifications to Cloudinary.
 *
 * Run from server/ (requires CLOUDINARY_* in .env):
 *   npm run upload:greeting-logo
 *
 * Copy the printed URL into GREETING_NOTIFICATION_IMAGE_URL (Vercel / .env).
 */
import '../config/env';
import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from '../config/cloudinary';

const LOGO_PATH = path.resolve(
  __dirname,
  '../../../client/src/assets/images/logo.png',
);

const upload = async (): Promise<void> => {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error(`Logo not found: ${LOGO_PATH}`);
    process.exit(1);
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env');
    process.exit(1);
  }

  const result = await uploadToCloudinary(LOGO_PATH, 'motonode/notifications', {
    resourceType: 'image',
  });

  console.log('\nGreeting logo uploaded successfully.\n');
  console.log('Add to server/.env and Vercel:\n');
  console.log(`GREETING_NOTIFICATION_IMAGE_URL=${result.url}\n`);
  console.log(`Public ID: ${result.publicId}`);
};

upload().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
