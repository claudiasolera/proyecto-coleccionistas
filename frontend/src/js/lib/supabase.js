import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://spbxbltadppuduvhphsy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwYnhibHRhZHBwdWR1dmhwaHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDg2MTUsImV4cCI6MjA5MTg4NDYxNX0.NcaP85vdzoA9rJUkt6V0R_hYCYYt3s_XGInu4FyetwU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
