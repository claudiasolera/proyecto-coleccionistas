import { supabase } from '../backend/src/db.js';

async function checkTable() {
    const { data, error } = await supabase.from('shipping_methods').select('*').limit(1);
    if (error) {
        console.log("Table 'shipping_methods' does not exist or error:", error.message);
    } else {
        console.log("Table 'shipping_methods' exists. Data:", data);
    }
}

checkTable();
