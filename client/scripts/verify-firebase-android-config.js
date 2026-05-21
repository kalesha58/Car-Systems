#!/usr/bin/env node
/**
 * Ensures google-services.json package_name matches the Android applicationId.
 * Run from client/: node scripts/verify-firebase-android-config.js
 */
const fs = require('fs');
const path = require('path');

const clientRoot = path.join(__dirname, '..');
const gsPath = path.join(clientRoot, 'android/app/google-services.json');
const buildGradlePath = path.join(clientRoot, 'android/app/build.gradle');

const readJson = filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
const appIdMatch = buildGradle.match(/applicationId\s+"([^"]+)"/);
const applicationId = appIdMatch?.[1];
if (!applicationId) {
  console.error('Could not read applicationId from android/app/build.gradle');
  process.exit(1);
}

const gs = readJson(gsPath);
const clients = gs.client || [];
const matching = clients.find(c => c.client_info?.android_client_info?.package_name === applicationId);

let failed = false;

if (!matching) {
  console.error(
    `No google-services.json client for applicationId "${applicationId}".`,
  );
  console.error(
    `Registered packages: ${clients.map(c => c.client_info?.android_client_info?.package_name).join(', ') || '(none)'}`,
  );
  failed = true;
}

const apiKey = matching?.api_key?.[0]?.current_key;
if (!apiKey || apiKey.includes('REPLACE')) {
  console.error('Invalid or placeholder Firebase API key in google-services.json');
  failed = true;
}

const appId = matching?.client_info?.mobilesdk_app_id;
if (!appId || appId.includes('REPLACE')) {
  console.error('Invalid or placeholder mobilesdk_app_id in google-services.json');
  failed = true;
}

if (failed) {
  console.error('See client/firebase/README.md');
  process.exit(1);
}

console.log(`OK: Firebase Android config matches ${applicationId}`);
