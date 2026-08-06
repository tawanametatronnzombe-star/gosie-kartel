const SUPABASE_URL = "https://tnlktzagziuwjjzgrrna.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRubGt0emFneml1d2pqemdycm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjA5MzIsImV4cCI6MjEwMTQ5NjkzMn0.uuj1wWwG8DfhCK8bqvzoGIaxuhDwlrNIxXwAL9jkd2c";

// Create a Supabase client for use in the browser. This uses the ANON key and
// should only be used for public, client-safe operations. Do NOT put a
// service_role key here.
// This file intentionally exposes `supabaseClient` as a global so other
// scripts (checkout.js) can use it directly.

if (typeof supabase !== 'undefined') {
  try {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('supabaseClient ready');
  } catch (err) {
    console.error('Failed to create supabase client', err);
    window.supabaseClient = undefined;
  }
} else {
  console.warn('Supabase library not loaded. Please include https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
  window.supabaseClient = undefined;
}
