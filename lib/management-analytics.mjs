import {weightedScore,PR_WEIGHTS,HEALTH_WEIGHTS} from "./metrics.mjs";
const PERIODS=new Set([30,90,365]);
export function reportPeriod(input){const days=Number(input??90);if(!PERIODS.has(days))throw Error("Select a 30, 90, or 365 day reporting window");return days;}
export async function buildManagementAnalytics(pool,days){
 if(!PERIODS.has(days))throw Error("Unsupported reporting window");
 const [bookings,demoBookings,trend,finance,roster]=await Promise.all([
  pool.query("SELECT status,synthetic,count(*)::int AS count FROM booking_enquiries WHERE created_at >= now()-make_interval(days=>$1) GROUP BY status,synthetic ORDER BY status,synthetic",[days]),
  pool.query("SELECT status,count(*)::int AS count FROM demo_booking_enquiries WHERE created_at >= now()-make_interval(days=>$1) GROUP BY status ORDER BY status",[days]),
  pool.query("SELECT to_char(date_trunc('week',created_at),'YYYY-MM-DD') AS week,count(*)::int AS count FROM booking_enquiries WHERE created_at >= now()-make_interval(days=>$1) GROUP BY date_trunc('week',created_at) ORDER BY date_trunc('week',created_at)",[days]),
  pool.query("SELECT COUNT(*) FILTER(WHERE status='draft')::int AS draft_count,COALESCE(SUM(amount_cents) FILTER(WHERE status IN ('issued','partially_paid','paid')),0)::text AS issued_cents,COALESCE(SUM(paid_cents) FILTER(WHERE status IN ('issued','partially_paid','paid')),0)::text AS paid_cents FROM booking_invoices WHERE created_at >= now()-make_interval(days=>$1)",[days]),
  pool.query("SELECT slug,stage_name,pr_factors,health_factors FROM artists WHERE synthetic=TRUE ORDER BY stage_name LIMIT 100")
 ]);
 const mapped=roster.rows.map(a=>({
  slug:a.slug,name:a.stage_name,prScore:weightedScore(a.pr_factors,PR_WEIGHTS),
  careerScore:weightedScore(a.health_factors,HEALTH_WEIGHTS),synthetic:true
 })).sort((a,b)=>b.prScore-a.prScore||a.name.localeCompare(b.name));
 return {
  periodDays:days,
  bookings:bookings.rows.map(r=>({status:r.status,count:r.count,synthetic:Boolean(r.synthetic)})),
  demoBookings:demoBookings.rows.map(r=>({status:r.status,count:r.count})),
  weeklyTrend:trend.rows.map(r=>({week:r.week,count:r.count})),
  finance:{draftCount:finance.rows[0].draft_count,issuedCents:finance.rows[0].issued_cents,paidCents:finance.rows[0].paid_cents},
  artistScores:mapped,
  sources:{
   artistScores:"FIXED WEIGHTED MODEL — ALL ARTISTS FICTIONAL; NOT LIVE PUBLIC-RELATIONS REPUTATION",
   bookingEnquiries:"Enquiries entered for the fictional artist roster; requests are not bookings",
   demoBookings:"Separate self-service demo pipeline",
   invoiceAmounts:"Recorded invoice amounts; paid amounts depend on verified ledger entries, not bank balance confirmation",
   noPersonalData:true
  },
  generatedAt:new Date().toISOString()
 };
}
