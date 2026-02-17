#!/usr/bin/env node
import { randomBytes } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DEFAULT_SECRET_PATH = '.secrets/session.secret';

function generateSessionSecret(outputPath: string = DEFAULT_SECRET_PATH): void {
  // Generate a cryptographically secure random secret (32 bytes = 256 bits)
  const secret = randomBytes(32).toString('base64');

  // Ensure the directory exists
  const dir = dirname(outputPath);
  mkdirSync(dir, { recursive: true });

  // Write the secret to file with restrictive permissions
  writeFileSync(outputPath, secret, { mode: 0o600 });

  console.log(`✓ Session secret generated and saved to: ${outputPath}`);
  console.log(`✓ Make sure to add this path to your .env file:`);
  console.log(`  SESSION_SECRET_PATH=${outputPath}`);
}

// Get output path from command line argument or use default
const outputPath = process.argv[2] || DEFAULT_SECRET_PATH;
generateSessionSecret(outputPath);
