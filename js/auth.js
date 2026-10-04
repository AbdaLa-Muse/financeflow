// Authentication UI and session helpers
'use strict';
function showAuth(message=''){
  $('#authGate').classList.remove('hidden'); $('#appShell').classList.add('hidden');
  $('#authError').textContent=message;
}
function showApp(){ $('#authGate').classList.add('hidden'); $('#appShell').classList.remove('hidden'); }
function setUserUi(user){
  const email=user?.email||'FinanceFlow user'; $('#userEmail').textContent=email;
  const initials=email.split('@')[0].split(/[._-]/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'FF'; $('#userAvatar').textContent=initials;
}
async function signIn(email,password){
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password}); if(error)throw error; return data.user;
}
async function signOut(){await supabaseClient.auth.signOut(); state=blankState(); showAuth('Signed out.');}
async function bootAuthenticatedApp(user){
  setUserUi(user); showApp();
  try{await loadCloudState();renderAll();}catch(err){console.error(err);showAuth(`Could not load your cloud data: ${err.message||err}`)}
}
