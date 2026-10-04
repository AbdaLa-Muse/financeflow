// Supabase connection — publishable key only. Never place a secret/service-role key in frontend code.
'use strict';
const SUPABASE_URL='https://epinieadpcoeqghonull.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_TQtfWP0k9e1-A0B74jGTBg_TzjIgQlv';
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
