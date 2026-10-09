import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in backend/.env');
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log(`
Usage:
  node scripts/get-test-token.js <email> <password>

Example:
  npm run token user@example.com my-password-123

Note:
  This script works for email/password users. For Google OAuth users,
  obtain the access token from the frontend session callback.
`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Signing in as ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Sign-in failed:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Authentication successful!\n');
  console.log('User ID:', data.user.id);
  console.log('Email:  ', data.user.email);
  console.log('\nAccess Token:\n', data.session.access_token);
  console.log('\nUse in Authorization header:');
  console.log(`Authorization: Bearer ${data.session.access_token}\n`);
}

main();
