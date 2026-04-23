import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testWorkerUpdate() {
  const { data, error } = await supabase.from('reports').select('id, worker_id').limit(1);
  console.log("Error checking worker_id:", error);
  console.log("Data:", data);
}

testWorkerUpdate();
