import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
// Using anon key: won't be able to bypass RLS to update unless I auth. 
// But let's just see if we get an RLS violation error or something else.
const supabase = createClient(url, key);

async function testUpdate() {
  const { error } = await supabase.from('reports').update({ status: 'collected' }).eq('id', 1);
  console.log("Update Error:", error);
}

testUpdate();
