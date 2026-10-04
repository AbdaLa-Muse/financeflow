// Finance calculations and shared lookup helpers
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:state.settings.currency,maximumFractionDigits:2}).format(Number(n)||0)}
function pct(n,d,digits=1){return d?`${(Number(n)/Number(d)*100).toFixed(digits)}%`:'0.0%'}
function account(id){return state.accounts.find(a=>a.id===id)}
function category(id){return state.categories.find(c=>c.id===id)}
function area(id){return state.areas.find(a=>a.id===id)}
function accountBalance(id){const a=account(id);if(!a)return 0;let b=Number(a.opening)||0;for(const t of state.transactions){if(t.type==='income'&&t.accountId===id)b+=Number(t.amount)||0;if(t.type==='expense'&&t.accountId===id)b-=Number(t.amount)||0;if(t.type==='transfer'){if(t.accountId===id)b-=Number(t.amount)||0;if(t.toAccountId===id)b+=Number(t.amount)||0}}return b}
function netWorth(){return state.accounts.reduce((s,a)=>s+accountBalance(a.id),0)}
function monthKey(date){return String(date||'').slice(0,7)}
function currentMonth(){return isoToday().slice(0,7)}
function monthTransactions(key=currentMonth()){return state.transactions.filter(t=>monthKey(t.date)===key)}
function sum(list){return list.reduce((s,x)=>s+Number(x.amount||0),0)}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2200)}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function options(items,valueKey='id',labelKey='name'){return items.map(x=>`<option value="${escapeHtml(x[valueKey])}">${escapeHtml(x[labelKey])}</option>`).join('')}
function iconForType(type){return type==='income'?'↗':type==='expense'?'↘':'⇄'}
function typeClass(type){return type==='income'?'positive':type==='expense'?'negative':''}
function transactionText(t){const a=account(t.accountId)?.name||'Unknown';const c=category(t.categoryId)?.name||(t.type==='transfer'?'Transfer':'Uncategorised');return `${c} · ${a}`}
function matchesSearch(values){if(!searchTerm)return true;const q=searchTerm.toLowerCase();return values.join(' ').toLowerCase().includes(q)}
function budgetSpent(catId,key=currentMonth()){return sum(monthTransactions(key).filter(t=>t.type==='expense'&&t.categoryId===catId))}
function isSavingsOrInvestmentAccount(id){const a=account(id);if(!a)return false;const label=`${a.type} ${area(a.areaId)?.name||''}`.toLowerCase();return /saving|investment|invest|crypto/.test(label)}
function dateFromISO(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)}
function isoDate(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function rangeForMode(mode,monthValue){
  const today=dateFromISO(isoToday());
  let start,end;
  if(mode==='month'){
    const key=monthValue||currentMonth();const [y,m]=key.split('-').map(Number);start=new Date(y,m-1,1);end=new Date(y,m,0);
  }else if(mode==='lastMonth'){
    start=new Date(today.getFullYear(),today.getMonth()-1,1);end=new Date(today.getFullYear(),today.getMonth(),0);
  }else if(mode==='threeMonths'){
    start=new Date(today.getFullYear(),today.getMonth()-2,1);end=today;
  }else if(mode==='year'){
    start=new Date(today.getFullYear(),0,1);end=today;
  }else{return {start:null,end:null,label:'All time'}}
  return {start:isoDate(start),end:isoDate(end),label:mode==='month'?start.toLocaleDateString('en-US',{month:'long',year:'numeric'}):mode==='lastMonth'?'Last month':mode==='threeMonths'?'Last 3 months':'This year'};
}
function txInRange(range){return state.transactions.filter(t=>(!range.start||t.date>=range.start)&&(!range.end||t.date<=range.end))}
function previousRange(range){
  if(!range.start||!range.end)return null;
  const s=dateFromISO(range.start),e=dateFromISO(range.end),days=Math.round((e-s)/86400000)+1;
  const pe=new Date(s);pe.setDate(pe.getDate()-1);const ps=new Date(pe);ps.setDate(ps.getDate()-days+1);
  return {start:isoDate(ps),end:isoDate(pe)};
}
function changePct(current,previous){if(!previous)return current?100:0;return (current-previous)/Math.abs(previous)*100}
