import {  createClient } from '@supabase/supabase-js';

const supabaseURL = "https://mjcfrjysshcqrqaxpxqi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qY2Zyanlzc2hjcXJxYXhweHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMTI4ODYsImV4cCI6MjAzOTU4ODg4Nn0.gFZM_fmc3bxKmIF5QOU8mZoZVQ-eJNTz1L2HI_U4zYc";

export const supabase = createClient(supabaseURL, supabaseAnonKey);
