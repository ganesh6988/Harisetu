import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkReports() {
  const { data, error } = await supabase.from('reports').select('*');
  console.log("Error:", error);
  console.log("Reports data length:", data ? data.length : "null");
  if (data && data.length > 0) {
     console.log("Latest report:", data[data.length - 1]);
  }
}

checkReports();
