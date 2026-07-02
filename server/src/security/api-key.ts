const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Admin function to generate a new API key
function generateApiKey(): string {
  // Generate a 32-byte random string (e.g., 'sk_live_4eC39HqLyjWDarjtT1zdp7dc')
  const rawKey = crypto.randomBytes(32).toString('hex');
  return rawKey;
}

// When saving to DB, hash it (optional but highly recommended)
async function hashApiKey(rawKey: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedKey = await bcrypt.hash(rawKey, salt);
  return hashedKey;
}
