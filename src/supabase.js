import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://iuqnbovkkknkviclrksw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cW5ib3Zra2tua3ZpY2xya3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTEwNzEsImV4cCI6MjA5Mjc2NzA3MX0.k3qdHvJPFnBAV7q3JXH6gg06LEUh02b9l3TQPHNGZyo'
)
