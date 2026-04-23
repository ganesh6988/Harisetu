import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testFetch() {
  console.log("Testing Admin Profile Query...");
  const { data: allProfiles, error: pErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  console.log("Profiles Error:", pErr);
  console.log("Profiles count:", allProfiles ? allProfiles.length : 0);

  console.log("\nTesting Admin Reports Query (with Foreign Key)...");
  const { data: allReports, error: rErr } = await supabase.from('reports').select(`*, profiles!reports_citizen_id_fkey(full_name)`).order('created_at', { ascending: false });
  console.log("Reports Error:", rErr);
  console.log("Reports count:", allReports ? allReports.length : 0);
  
  console.log("\nTesting Alternate Reports Query (without forced FK name)...");
  const { data: altReports, error: altErr } = await supabase.from('reports').select(`*, profiles(full_name)`).order('created_at', { ascending: false });
  console.log("Alternate Reports Error:", altErr);
  console.log("Alternate Reports count:", altReports ? altReports.length : 0);
}

testFetch();
