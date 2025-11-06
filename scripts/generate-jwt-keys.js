/**
 * Generate RSA keypair for JWT signing
 * Run: node scripts/generate-jwt-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const secretsDir = path.join(__dirname, '..', 'secrets');
const privateKeyPath = path.join(secretsDir, 'jwt-private.pem');
const publicKeyPath = path.join(secretsDir, 'jwt-public.pem');

// Create secrets directory if it doesn't exist
if (!fs.existsSync(secretsDir)) {
  fs.mkdirSync(secretsDir, { recursive: true });
  console.log('✅ Created secrets directory');
}

// Generate RSA keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Write keys to files
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log('✅ Generated RSA keypair:');
console.log(`   Private key: ${privateKeyPath}`);
console.log(`   Public key: ${publicKeyPath}`);
console.log('\n⚠️  Keep these keys secure! Do not commit them to git.');

