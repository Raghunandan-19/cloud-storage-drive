const { createClient } = require('@supabase/supabase-js');
// ensure env vars are loaded even if this file is imported before app.js
try { require('dotenv').config(); } catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'files';

if (!SUPABASE_URL || !(SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)) {
    console.warn('Supabase env not set: SUPABASE_URL / SUPABASE_(SERVICE_ROLE_KEY|ANON_KEY)');
}

// Prefer service role key when available (server-side only)
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, supabaseKey, {
    auth: { persistSession: false }
});

module.exports = { supabase, SUPABASE_BUCKET };


