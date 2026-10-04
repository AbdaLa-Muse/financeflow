// FinanceFlow V6 — shared constants and blank initial state
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID();
const isoToday=()=>new Date().toISOString().slice(0,10);
const blankState=()=>({
  settings:{currency:localStorage.getItem('financeflow_currency')||'USD',theme:localStorage.getItem('financeflow_theme')||'dark'},
  areas:[],accounts:[],categories:[],transactions:[],budgets:[],goals:[],subscriptions:[]
});
function clone(x){return JSON.parse(JSON.stringify(x))}
function migrate(obj){
  const b=blankState(), src=obj||{};
  for(const key of ['areas','accounts','categories','transactions','budgets','goals','subscriptions']) b[key]=Array.isArray(src[key])?clone(src[key]):[];
  b.settings=Object.assign({},b.settings,src.settings||{});
  return b;
}
