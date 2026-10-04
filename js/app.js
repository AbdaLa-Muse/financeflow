// Application state, event wiring and authenticated startup
'use strict';
let state=blankState();
let currentPage='dashboard';
let searchTerm='';
let analysisMode='month';
let analysisMonth=currentMonth();

function bindAppEvents(){
  $('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)switchPage(b.dataset.page)});
  document.addEventListener('click',e=>{
    const j=e.target.closest('[data-jump]');if(j)switchPage(j.dataset.jump);
    const ed=e.target.closest('[data-edit-tx],[data-edit-account],[data-edit-budget],[data-edit-goal],[data-edit-sub],[data-edit-category],[data-edit-area]');if(ed){handleEdit(ed);return}
    const dp=e.target.closest('[data-duplicate-tx],[data-duplicate-account],[data-duplicate-budget],[data-duplicate-goal],[data-duplicate-sub],[data-duplicate-category],[data-duplicate-area]');if(dp){handleDuplicate(dp);return}
    const d=e.target.closest('[data-delete-tx],[data-delete-account],[data-delete-budget],[data-delete-goal],[data-delete-sub],[data-delete-category],[data-delete-area]');if(d){handleDelete(d);return}
    if(e.target.closest('[data-close-modal]'))closeModal();
  });
  $('#addTransactionBtn').addEventListener('click',()=>transactionModal('expense'));
  $('#genericAddBtn').addEventListener('click',genericAdd);
  $('#modalClose').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  $('#searchBtn').addEventListener('click',()=>{const wrap=$('#searchWrap');wrap.classList.toggle('active');if(wrap.classList.contains('active'))$('#globalSearch').focus();else{searchTerm='';$('#globalSearch').value='';if(currentPage!=='dashboard')renderGeneric(currentPage)}});
  $('#globalSearch').addEventListener('input',e=>{searchTerm=e.target.value.trim();if(currentPage!=='dashboard')renderGeneric(currentPage)});
  $('#notifyBtn').addEventListener('click',()=>{const over=state.budgets.filter(b=>budgetSpent(b.categoryId,b.month||currentMonth())>b.amount);toast(over.length?`${over.length} budget${over.length>1?'s are':' is'} over limit`:'No urgent alerts')});
  $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#pageFilters').addEventListener('change',e=>{
    if(e.target.id==='analysisRange'){analysisMode=e.target.value;renderAnalysis()}
    if(e.target.id==='analysisMonth'){analysisMonth=e.target.value||currentMonth();analysisMode='month';renderAnalysis()}
  });
  $('#genericContent').addEventListener('change',e=>{
    if(e.target.id==='currencySetting'){state.settings.currency=e.target.value;savePreferences();renderAll();toast('Currency updated')}
    if(e.target.id==='themeSetting'){state.settings.theme=e.target.value;savePreferences();renderAll();toast('Theme updated')}
  });
  $('#genericContent').addEventListener('click',async e=>{
    if(e.target.id==='exportBtn')exportBackup();
    if(e.target.id==='importBtn')$('#importFile').click();
    if(e.target.id==='resetBtn')confirmDelete('Permanently delete all of your FinanceFlow cloud data?',async()=>{state=blankState();await save()});
    if(e.target.id==='logoutSettingsBtn')await signOut();
  });
  $('#importFile').addEventListener('change',e=>{if(e.target.files[0])importBackup(e.target.files[0]);e.target.value=''});
  $('#logoutBtn').addEventListener('click',signOut);
}

async function start(){
  bindAppEvents();
  $('#loginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=$('#loginBtn'), email=$('#loginEmail').value.trim(), password=$('#loginPassword').value;
    $('#authError').textContent=''; btn.disabled=true; btn.textContent='Signing in…';
    try{const user=await signIn(email,password);await bootAuthenticatedApp(user)}catch(err){$('#authError').textContent=err.message||'Sign in failed'}finally{btn.disabled=false;btn.textContent='Sign in'}
  });
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session?.user)await bootAuthenticatedApp(session.user);else showAuth();
  supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'||!session)showAuth();
  });
}

start().catch(err=>showAuth(err.message||'Could not start FinanceFlow'));
window.FinanceFlow={state:()=>state,switchPage,renderAll,openTransaction:transactionModal};
