import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    const { data, error } = await supabase.from('reports').select('*').limit(1);
    if (error) {
        console.error('Error fetching reports:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No data found to infer columns. Insert a dummy row or check dashboard.');
            // Let's try to insert one and then see error? Or just get columns using standard postgREST
            // But we don't have direct SQL access here.
        }
    }
}

checkSchema();
