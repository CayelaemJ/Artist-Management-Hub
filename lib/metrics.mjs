// Deterministic scoring and money arithmetic, not machine-generated verdicts.
export const PR_WEIGHTS = [20,15,15,15,10,15,10];
export const HEALTH_WEIGHTS = [30,25,15,20,10];
export function weightedScore(factors,weights){
  if (!Array.isArray(factors)||factors.length!==weights.length) return null;
  if (factors.some(x=>x===null||x===undefined||x===""||!Number.isFinite(Number(x))||Number(x)<0||Number(x)>100)) return null;
  const sum=weights.reduce((n,w,i)=>n+w*Number(factors[i]),0);
  return Math.round(sum/weights.reduce((a,b)=>a+b,0));
}
export function financialTotals(gigs){
  const completed=gigs.filter(g=>g.status==="completed");
  const confirmed=gigs.filter(g=>g.status==="confirmed");
  const revenue=completed.reduce((s,g)=>s+Number(g.fee_zar),0);
  const expenses=completed.reduce((s,g)=>s+Number(g.expense_zar),0);
  return {actualRevenue:revenue,actualExpenses:expenses,actualProfit:revenue-expenses,
   confirmedFuture:confirmed.reduce((s,g)=>s+Number(g.fee_zar),0),
   openOpportunities:0, forecastLabel:"Known confirmed work only — not a predictive forecast"};
}
