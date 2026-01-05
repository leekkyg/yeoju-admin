import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://izcgdugcpjidrupgkran.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6Y2dkdWdjcGppZHJ1cGdrcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzQyNTAsImV4cCI6MjA4MzA1MDI1MH0.NogZeO_poGgF7puiB4TRKgs1T98dlu0vPFLEK3yPiTs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)