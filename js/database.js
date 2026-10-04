// Supabase database adapter + queued cloud persistence
'use strict';
let lastSynced=blankState();
let saveChain=Promise.resolve();

const typeToDb=t=>({Bank:'bank',Savings:'savings',Cash:'cash',Investment:'investment',Crypto:'crypto','Credit Card':'credit_card',Other:'other'}[t]||'other');
const typeFromDb=t=>({bank:'Bank',savings:'Savings',cash:'Cash',investment:'Investment',crypto:'Crypto',credit_card:'Credit Card',other:'Other'}[t]||'Other');
const iconForAccountType=t=>({Bank:'▣',Savings:'◈',Cash:'◐',Investment:'↗',Crypto:'◇','Credit Card':'▤',Other:'○'}[t]||'▣');
const monthDate=m=>/^\d{4}-\d{2}$/.test(String(m||''))?`${m}-01`:String(m||'').slice(0,10)||`${currentMonth()}-01`;

function setSyncState(text,kind=''){
  const el=$('#syncStatus'); if(!el)return;
  el.textContent=text; el.dataset.kind=kind;
}
function savePreferences(){
  localStorage.setItem('financeflow_currency',state.settings.currency);
  localStorage.setItem('financeflow_theme',state.settings.theme);
}

async function currentUser(){
  const {data:{user},error}=await supabaseClient.auth.getUser();
  if(error)throw error; return user;
}

async function loadCloudState(){
  setSyncState('Loading…','busy');
  const user=await currentUser();
  if(!user)throw new Error('Not signed in');
  const tables=['areas','categories','accounts','transactions','budgets','goals','subscriptions'];
  const results=await Promise.all(tables.map(table=>supabaseClient.from(table).select('*')));
  const failed=results.find(r=>r.error); if(failed)throw failed.error;
  const [areasR,categoriesR,accountsR,transactionsR,budgetsR,goalsR,subsR]=results.map(r=>r.data||[]);
  const next=blankState();
  next.areas=areasR.map(r=>({id:r.id,name:r.name,description:r.description||''}));
  next.categories=categoriesR.map(r=>({id:r.id,name:r.name,type:r.type}));
  next.accounts=accountsR.filter(r=>!r.is_archived).map(r=>{const type=typeFromDb(r.account_type);return{id:r.id,name:r.name,type,areaId:r.area_id||null,opening:Number(r.opening_balance)||0,icon:iconForAccountType(type)}});
  next.transactions=transactionsR.map(r=>({
    id:r.id,type:r.transaction_type,date:r.transaction_date,description:r.description||'',notes:r.notes||'',amount:Number(r.amount)||0,
    categoryId:r.category_id||null,
    accountId:r.transaction_type==='transfer'?(r.from_account_id||null):(r.account_id||null),
    toAccountId:r.to_account_id||null,
    incomeType:r.income_type||null,incomeStatus:r.income_status||null
  }));
  next.budgets=budgetsR.map(r=>({id:r.id,categoryId:r.category_id,amount:Number(r.amount)||0,month:String(r.month).slice(0,7)}));
  next.goals=goalsR.map(r=>({id:r.id,name:r.name,current:Number(r.current_amount)||0,target:Number(r.target_amount)||0,deadline:r.deadline||'',linkedAccountId:r.linked_account_id||null,status:r.status||'active'}));
  next.subscriptions=subsR.map(r=>({id:r.id,name:r.name,amount:Number(r.amount)||0,frequency:(r.frequency||'monthly').replace(/^./,c=>c.toUpperCase()),nextDate:r.next_payment_date||'',accountId:r.account_id||null,categoryId:r.category_id||null,active:Boolean(r.is_active)}));
  state=migrate(next); lastSynced=clone(state); savePreferences(); setSyncState('Cloud synced','ok'); return state;
}

function rowsFor(snapshot,userId){
  return {
    areas:snapshot.areas.map(x=>({id:x.id,user_id:userId,name:x.name,description:x.description||null})),
    categories:snapshot.categories.map(x=>({id:x.id,user_id:userId,name:x.name,type:x.type==='both'?'both':x.type})),
    accounts:snapshot.accounts.map(x=>({id:x.id,user_id:userId,name:x.name,account_type:typeToDb(x.type),opening_balance:Number(x.opening)||0,area_id:x.areaId||null,is_archived:false})),
    transactions:snapshot.transactions.map(x=>({
      id:x.id,user_id:userId,transaction_type:x.type,amount:Number(x.amount)||0,transaction_date:x.date,description:x.description||null,notes:x.notes||null,
      category_id:x.type==='transfer'?null:(x.categoryId||null),
      account_id:x.type==='transfer'?null:(x.accountId||null),
      from_account_id:x.type==='transfer'?(x.accountId||null):null,
      to_account_id:x.type==='transfer'?(x.toAccountId||null):null,
      income_type:x.type==='income'?(x.incomeType||'other'):null,
      income_status:x.type==='income'?(x.incomeStatus||'paid'):null
    })),
    budgets:snapshot.budgets.map(x=>({id:x.id,user_id:userId,category_id:x.categoryId,amount:Number(x.amount)||0,month:monthDate(x.month||currentMonth())})),
    goals:snapshot.goals.map(x=>({id:x.id,user_id:userId,name:x.name,target_amount:Number(x.target)||0,current_amount:Number(x.current)||0,deadline:x.deadline||null,linked_account_id:x.linkedAccountId||null,status:x.status||'active'})),
    subscriptions:snapshot.subscriptions.map(x=>({id:x.id,user_id:userId,name:x.name,amount:Number(x.amount)||0,frequency:String(x.frequency||'monthly').toLowerCase(),next_payment_date:x.nextDate||null,account_id:x.accountId||null,category_id:x.categoryId||null,is_active:Boolean(x.active)}))
  };
}

function idsByKey(snapshot,key){return new Set((snapshot[key]||[]).map(x=>x.id))}
async function deleteRemoved(table,key,previous,next){
  const nextIds=idsByKey(next,key), removed=(previous[key]||[]).map(x=>x.id).filter(id=>!nextIds.has(id));
  if(!removed.length)return;
  const {error}=await supabaseClient.from(table).delete().in('id',removed); if(error)throw error;
}
async function upsertRows(table,rows){if(!rows.length)return;const {error}=await supabaseClient.from(table).upsert(rows,{onConflict:'id'});if(error)throw error}

async function syncCloudState(snapshot){
  const user=await currentUser(); if(!user)throw new Error('Session expired');
  setSyncState('Saving…','busy');
  const rows=rowsFor(snapshot,user.id);
  // Delete dependants first, then parents.
  for(const [table,key] of [['transactions','transactions'],['budgets','budgets'],['goals','goals'],['subscriptions','subscriptions'],['accounts','accounts'],['categories','categories'],['areas','areas']]) await deleteRemoved(table,key,lastSynced,snapshot);
  // Upsert parents first, then dependants.
  for(const [table,key] of [['areas','areas'],['categories','categories'],['accounts','accounts'],['transactions','transactions'],['budgets','budgets'],['goals','goals'],['subscriptions','subscriptions']]) await upsertRows(table,rows[key]);
  lastSynced=clone(snapshot); savePreferences(); setSyncState('Saved','ok');
}

function save(){
  const snapshot=clone(state);
  savePreferences();
  saveChain=saveChain.catch(()=>{}).then(()=>syncCloudState(snapshot)).catch(err=>{console.error(err);setSyncState('Save failed','error');toast(`Cloud save failed: ${err.message||err}`)});
  return saveChain;
}

async function clearCloudData(){state=blankState();await save();renderAll()}
