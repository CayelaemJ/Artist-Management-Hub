// Public, synthetic roster fallback: no personal data and no simulated booking confirmations.
const staticDemoArtists=[
 {slug:"echo-dune",stage_name:"Echo Dune",genre:"Amapiano / DJ",city:"Johannesburg",tagline:"The next pulse of the city.",starting_fee_zar:6500,art_theme:"clay"},
 {slug:"auri-sol",stage_name:"Auri Sol",genre:"Afro-pop / Live",city:"Cape Town",tagline:"Soul in full colour.",starting_fee_zar:28000,art_theme:"gold"},
 {slug:"kinetic-moko",stage_name:"Kinetic Moko",genre:"Hip-hop / Rap",city:"Pretoria",tagline:"Made of motion.",starting_fee_zar:10000,art_theme:"teal"},
 {slug:"velvet-umoya",stage_name:"Velvet Umoya",genre:"R&B / Soul",city:"Durban",tagline:"Soft edges. Powerful stories.",starting_fee_zar:14000,art_theme:"rust"},
 {slug:"moya-chorus",stage_name:"Moya Chorus",genre:"Gospel / Vocal",city:"Gqeberha",tagline:"A sound that lifts.",starting_fee_zar:22000,art_theme:"clay"},
 {slug:"milo-static",stage_name:"Milo Static",genre:"Comedy / Stand-up",city:"Johannesburg",tagline:"A new kind of punchline.",starting_fee_zar:12000,art_theme:"teal"},
 {slug:"copper-atlas",stage_name:"Copper Atlas",genre:"Jazz / Ensemble",city:"Stellenbosch",tagline:"Improvisation without borders.",starting_fee_zar:24000,art_theme:"gold"},
 {slug:"night-current",stage_name:"Night Current",genre:"Electronic / Producer",city:"Soweto",tagline:"Future sound, grounded roots.",starting_fee_zar:18000,art_theme:"rust"}
];
let publicPreviewOnly=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(Number(v||0));
const prettyDate=v=>{const d=String(v).slice(0,10);return new Date(d+"T12:00:00").toLocaleDateString("en-ZA",{day:"numeric",month:"short",year:"numeric"});};
const PR_NAMES=["Media sentiment","Craft & achievements","Booking reliability","Reputation trajectory","Credible engagement","Industry relationships","Constructive communication"];
const CAREER_NAMES=["Financial stability","Booking momentum","Relative audience growth","Professional development","Workload balance"];
let artists=[],filter="all",adminToken="",currentArtist="",allowedTransitions={},demoAccount=null;
const fetchJSON=async(url,options={})=>{
 const r=await fetch(url,options);let d;
 try{d=await r.json();}catch{d={error:"Unexpected server response"};}
 if(!r.ok)throw Error(d.error||"Request failed");
 return d;
};
const postJSON=(method,body)=>({method,headers:{"Content-Type":"application/json",...(adminToken?{"Authorization":"Bearer "+adminToken}:{})},body:JSON.stringify(body)});
function filteredArtists(){
 const q=$("artist-search").value.trim().toLowerCase();
 return artists.filter(a=>{
  const match=!q||[a.stage_name,a.genre,a.city,a.tagline].join(" ").toLowerCase().includes(q);
  const g=a.genre.toLowerCase();
  const category=filter==="all"||filter==="dj"&&g.includes("dj")||filter==="other"&&(g.includes("comedy")||g.includes("stand-up"))||filter==="music"&&!g.includes("comedy")&&!g.includes("stand-up");
  return match&&category;
 });
}
function renderRoster(){
 const data=filteredArtists();
 $("artist-grid").innerHTML=data.map(a=>{
  const initials=a.stage_name.split(" ").slice(0,2).map(x=>x[0]).join("");
  return '<article class="artist-card"><div class="artist-art '+esc(a.art_theme)+'"><span class="artist-sigil">'+esc(initials)+'</span><span class="genre-tag">'+esc(a.genre)+'</span></div>'+
   '<div class="artist-info"><span class="city">'+esc(a.city)+'</span><h3>'+esc(a.stage_name)+'</h3><p class="tagline">'+esc(a.tagline)+'</p>'+
   '<div class="artist-info-bottom"><span>FROM '+money(a.starting_fee_zar)+'</span><button type="button" data-book="'+esc(a.slug)+'">ENQUIRE ↗</button></div></div></article>';
 }).join("")||'<p class="loading">No matching artists in this fictional roster.</p>';
 $("artist-grid").querySelectorAll("[data-book]").forEach(b=>b.addEventListener("click",()=>openBooking(b.dataset.book)));
}
function openBooking(slug){
 const a=artists.find(a=>a.slug===slug);
 if(!a)return;
 $("booking-form").reset();
 $("booking-slug").value=slug;
 $("booking-artist-name").textContent=a.stage_name+" · "+a.genre;
 $("booking-status").textContent=publicPreviewOnly?"Booking requests are temporarily unavailable while the live database connection is being configured. Please do not enter private details.":"";
 $("send-enquiry").disabled=publicPreviewOnly;
 $("booking-date").min=new Date().toISOString().slice(0,10);
 $("booking-dialog").showModal();
}
async function sendBooking(e){
 e.preventDefault();const f=$("booking-form"),button=$("send-enquiry");
 const data=Object.fromEntries(new FormData(f));
 $("booking-status").textContent="Submitting your enquiry…";button.disabled=true;
 try{
  const r=await fetchJSON("/api/bookings",postJSON("POST",{...data,artistSlug:$("booking-slug").value}));
  f.querySelectorAll("input:not([type=hidden]), textarea").forEach(el=>el.disabled=true);
  $("booking-status").textContent="✓ Enquiry saved. Reference: "+r.reference+". This is not a confirmed booking. No automatic email has been sent.";
 }catch(err){$("booking-status").textContent="Could not save enquiry: "+err.message;}
 finally{button.disabled=false;}
}
function resetBookingFields(){
 $("booking-form").querySelectorAll("input, textarea").forEach(el=>el.disabled=false);
}
function showStudio(panel="overview"){
 $("public-view").hidden=true;$("studio-view").hidden=false;
 document.querySelectorAll(".studio-tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.panel===panel));
 for(const id of ["demo","overview","enquiries","ai"])$(id+"-panel").hidden=id!==panel;
 if(location.pathname!=="/studio")history.pushState({view:"studio"},"","/studio");
 window.scrollTo(0,0);
 if(panel==="overview")loadOverview();
 if(panel==="demo")loadDemoWorkspace();
}
function showPublic(){
 $("studio-view").hidden=true;$("public-view").hidden=false;
 if(location.pathname!=="/")history.pushState({view:"public"},"","/");
 window.scrollTo(0,0);
}
function scoreList(factors,names,career=false){
 return '<ul class="score-breakdown">'+names.map((n,i)=>{
  const v=Number(factors[i]);
  return '<li><span>'+esc(n)+'</span><progress class="score-progress '+(career?"career-track":"")+'" value="'+Math.min(100,Math.max(0,v))+'" max="100"></progress><b>'+v+'</b></li>';
 }).join("")+'</ul>';
}
function kpi(title,value,foot){
 return '<article class="metric-card"><span>'+esc(title)+'</span><strong>'+esc(value)+'</strong><small>'+esc(foot)+'</small></article>';
}

const DEMO_SCORES=[
 [[73,80,86,76,70,78,82],[72,81,79,91,75]],
 [[84,88,92,80,86,82,90],[65,88,80,81,69]],
 [[67,83,77,70,73,84,70],[61,76,80,92,78]],
 [[88,90,89,84,78,91,86],[76,78,86,83,82]],
 [[91,85,94,87,83,91,94],[81,85,74,78,86]],
 [[79,74,86,75,78,80,76],[68,90,84,81,64]],
 [[88,92,94,91,84,85,92],[85,76,71,94,80]],
 [[81,85,88,79,79,87,80],[74,83,87,89,70]]
];
const demoWeights={pr:[20,15,15,15,10,15,10],health:[30,25,15,20,10]};
function demoScore(nums,weights){
 if(!Array.isArray(nums)||nums.length!==weights.length||nums.some(n=>!Number.isFinite(n)))return null;
 return Math.round(nums.reduce((total,n,i)=>total+n*weights[i],0)/weights.reduce((a,b)=>a+b,0));
}
function demoOverview(slug){
 const index=staticDemoArtists.findIndex(a=>a.slug===slug);
 if(index<0)throw Error("Artist not found");
 const artist=staticDemoArtists[index],factors=DEMO_SCORES[index];
 const fee=artist.starting_fee_zar,expense=Math.round(fee*.37),futureExpense=Math.round(fee*.3);
 return {
  demo:true,localPreview:true,artist,
  pr:{score:demoScore(factors[0],demoWeights.pr),factors:factors[0],weights:demoWeights.pr,confidence:"Synthetic illustration; no live listening"},
  career:{score:demoScore(factors[1],demoWeights.health),factors:factors[1],weights:demoWeights.health,confidence:"Synthetic illustration; not a validated wellbeing metric"},
  financial:{actualRevenue:Math.round(fee*.9),actualExpenses:expense,actualProfit:Math.round(fee*.9)-expense,confirmedFuture:fee,openOpportunities:0},
  gigs:[{event_date:"2026-09-18",event_name:"City Sessions / DEMO",fee_zar:Math.round(fee*.9),expense_zar:expense,status:"completed"},
        {event_date:"2026-11-18",event_name:"Nights in Sound / DEMO",fee_zar:fee,expense_zar:futureExpense,status:"confirmed"}],
  mentions:[{platform:"Simulated press",topic:"Creative performance discussion (fictional)",sentiment:"positive"},
            {platform:"Simulated audience",topic:"Fictional listener response",sentiment:"mixed"}]
 };
}
function dashboardNotes(d){
 const score=d.pr.score,health=d.career.score;
 const lowPR=d.pr.factors.map((v,i)=>({v,label:PR_NAMES[i]})).sort((a,b)=>a.v-b.v)[0];
 const lowCareer=d.career.factors.map((v,i)=>({v,label:CAREER_NAMES[i]})).sort((a,b)=>a.v-b.v)[0];
 return '<section class="dash-card dashboard-wide"><h3>Career guidance & next steps</h3><p>Illustrative suggestions inferred from fictional scores, not conclusions about a real person.</p><div class="insight-grid">'+
 '<article><span class="eyebrow">REPUTATION OPPORTUNITY</span><strong>'+esc(lowPR.label)+'</strong><p>Lowest synthetic PR dimension ('+lowPR.v+'/100). Validate evidence with the artist before setting any reputation action.</p></article>'+
 '<article><span class="eyebrow">CAREER OPPORTUNITY</span><strong>'+esc(lowCareer.label)+'</strong><p>Lowest synthetic Career Health dimension ('+lowCareer.v+'/100). Discuss personal goals and support needs rather than comparing follower counts.</p></article>'+
 '<article><span class="eyebrow">FINANCIAL PLANNING</span><strong>'+money(d.financial.confirmedFuture)+'</strong><p>Illustrative confirmed future fees. This is not money received, a tax provision or a profit forecast.</p></article>'+
 '</div><p class="fineprint">Model: fixed transparent weighted indices • PR '+score+'/100 • Career '+health+'/100 • Synthetic coverage and confidence only • No live social sources</p></section>';
}

async function loadOverview(){
 const slug=$("studio-artist").value||artists[0]?.slug;if(!slug)return;
 currentArtist=slug;
 $("overview-content").innerHTML='<p class="loading">Reading synthetic demo metrics…</p>';
 $("overview-error").hidden=true;
 try{
  let d;
  try { d=await fetchJSON("/api/demo/artist/"+encodeURIComponent(slug)); }
  catch(e){ if(!publicPreviewOnly)throw e; d=demoOverview(slug); }
  const p=d.pr,h=d.career,f=d.financial;
  const previewNotice=d.localPreview?'<div class="dashboard-preview">DEMO PREVIEW — database unavailable. All data below is calculated locally from fictional examples; no live bookings, social listening or financial records.</div>':'<div class="dashboard-preview">SYNTHETIC DATA FROM DATABASE — not actual artist income, social listening or a validated PR assessment.</div>';
  const gigs=d.gigs.map(g=>'<div class="gig-row"><div><strong>'+esc(g.event_name)+'</strong><br><span>'+prettyDate(g.event_date)+'</span></div><div style="text-align:right"><strong>'+money(g.fee_zar)+'</strong><br><span class="status-pill">'+esc(g.status)+'</span></div></div>').join("");
  const social=d.mentions.map(m=>'<div class="mention-row"><div><strong>'+esc(m.platform)+'</strong><br><span>'+esc(m.topic)+'</span></div><span class="status-pill">'+esc(m.sentiment)+'</span></div>').join("");
  $("overview-content").innerHTML=previewNotice+'<div class="metrics-grid">'+
    kpi("COMPLETED GIG REVENUE",money(f.actualRevenue),"SYNTHETIC / HISTORICAL")+
    kpi("COSTS OF COMPLETED GIGS",money(f.actualExpenses),"SYNTHETIC EXPENSES")+
    kpi("PROFIT ON COMPLETED GIGS",money(f.actualProfit),"REVENUE LESS COSTS")+
    kpi("CONFIRMED FUTURE FEES",money(f.confirmedFuture),"NOT YET CASH RECEIVED")+
    '</div><div class="dashboard-cols"><section class="dash-card"><h3>Reputation & PR</h3><p>Illustrative weighted score. This is not a factual public judgement.</p><div class="score-head"><div><span class="eyebrow">PR INTELLIGENCE</span><p>Confidence: demo-only</p></div><div class="score-circle"><strong>'+esc(p.score)+'</strong><small>OUT OF 100</small></div></div>'+scoreList(p.factors,PR_NAMES)+'</section>'+
    '<section class="dash-card"><h3>Career Health</h3><p>Separate from fame: a sustainability and personal-progress illustration.</p><div class="score-head"><div><span class="eyebrow">CAREER DEVELOPMENT</span><p>Confidence: demo-only</p></div><div class="score-circle career"><strong>'+esc(h.score)+'</strong><small>OUT OF 100</small></div></div>'+scoreList(h.factors,CAREER_NAMES,true)+'</section>'+
    '<section class="dash-card"><h3>Performance calendar</h3><p>Simulated historical and upcoming bookings; upcoming fees are not paid revenue.</p>'+gigs+'</section>'+
    '<section class="dash-card"><h3>Social listening signals</h3><p>These are fictional examples, not live API data. Monitoring connectors are not yet connected.</p>'+social+'</section></div>'+dashboardNotes(d);
 }catch(err){$("overview-content").innerHTML="";$("overview-error").hidden=false;$("overview-error").textContent=err.message;}
}
async function loadEnquiries(){
 const message=$("admin-message"),out=$("enquiry-list");
 message.textContent="Fetching private enquiries…";
 try{
  const d=await fetchJSON("/api/admin/enquiries",{headers:{"Authorization":"Bearer "+adminToken}});
  allowedTransitions=d.allowedTransitions;message.textContent=d.enquiries.length+" private booking enquiries. Keep contact details confidential.";
  out.innerHTML=d.enquiries.map(x=>{
   const opts=(allowedTransitions[x.status]||[]).map(s=>'<option value="'+esc(s)+'">'+esc(s.replaceAll("_"," "))+'</option>').join("");
   return '<article class="enquiry-item"><h3>'+esc(x.stage_name)+' · '+esc(x.event_type)+'</h3>'+
    '<p>REFERENCE: '+esc(x.id)+'</p><p>'+prettyDate(x.event_date)+' / '+esc(x.venue)+'</p>'+
    '<p>Contact: '+esc(x.contact_name)+' · '+esc(x.contact_email)+'</p><p>Budget: '+(x.budget_zar==null?"Not supplied":money(x.budget_zar))+' / '+esc(x.message)+'</p>'+
    '<p>CURRENT STATUS: <strong class="status-pill">'+esc(x.status)+'</strong></p>'+
    (opts?'<div class="actions"><select aria-label="Next booking status" data-next="'+esc(x.id)+'">'+opts+'</select><button type="button" data-update="'+esc(x.id)+'">Update status ↗</button></div>':'<p>No further transitions available.</p>')+'</article>';
  }).join("")||'<p class="loading">No new enquiries yet.</p>';
  out.querySelectorAll("[data-update]").forEach(button=>button.addEventListener("click",async()=>{
   const id=button.dataset.update,s=out.querySelector('[data-next="'+id+'"]').value;
   if(!confirm("Move this booking to "+s.replaceAll("_"," ")+"?"))return;
   button.disabled=true;
   try{await fetchJSON("/api/admin/enquiries/"+id,postJSON("PATCH",{status:s}));await loadEnquiries();}
   catch(err){message.textContent=err.message;button.disabled=false;}
  }));
 }catch(err){message.textContent="Cannot access enquiries: "+err.message;out.innerHTML="";}
}
async function askAI(e){
 e.preventDefault();
 const answer=$("ai-answer");answer.textContent="Asking CABO intelligence…";
 if(!adminToken){answer.textContent="Enter your management token under Booking management first.";return;}
 try{
  const d=await fetchJSON("/api/ai/advice",postJSON("POST",{artistSlug:$("ai-artist").value,question:$("ai-question").value}));
  answer.textContent=d.answer+"\n\n— AI-generated advice based on synthetic demo data. Review before using.";
 }catch(err){answer.textContent="AI not available: "+err.message;}
}

function signInDialog(){
 $("signin-error").textContent="";
 $("signin-password").value="";
 $("signin-dialog").showModal();
}
function setDemoUI(account){
 demoAccount=account;
 $("open-signin").hidden=Boolean(account);
 $("my-account").hidden=!account;
 $("signout-button").hidden=!account;
 $("my-account").textContent=account?"My "+account.role+" studio":"My demo studio";
}
async function restoreDemoSession(){
 try{
  const d=await fetchJSON("/api/demo-auth/me");
  setDemoUI(d.account);
 }catch{setDemoUI(null);}
}
async function loadDemoWorkspace(){
 const root=$("demo-workspace-content");
 if(!demoAccount){
  root.innerHTML='<div class="demo-welcome"><h3>Sign in to your demo workspace</h3><p>Choose Customer, Artist or Manager. Each role is fully synthetic, with no access to confidential records.</p></div><button class="primary-button" id="workspace-signin" type="button">Choose an account ↗</button>';
  $("workspace-signin").addEventListener("click",signInDialog);
  return;
 }
 root.innerHTML='<p class="loading">Loading your fictional role workspace…</p>';
 try{
  const d=await fetchJSON("/api/demo-auth/workspace");
  const items=d.highlights.map(x=>'<article class="demo-action"><small>'+esc(x.label.toUpperCase())+'</small><strong>'+esc(x.value)+'</strong><p>'+esc(x.detail)+'</p></article>').join("");
  const tasks=d.activities.map(x=>'<li>'+esc(x)+'</li>').join("");
  root.innerHTML='<div class="demo-welcome"><span class="eyebrow">'+esc(d.role)+' ACCOUNT · SYNTHETIC DEMONSTRATION</span><h3>'+esc(d.title)+'</h3><p>Signed in as '+esc(d.email)+'. None of the information below represents a real customer, artist or booking.</p></div>'+
  '<div class="demo-actions">'+items+'</div><section class="demo-tasks"><h3>Suggested next steps</h3><ol>'+tasks+'</ol></section>'+
  '<button class="outline-button demo-go" id="demo-explore" type="button">Explore fictional artist intelligence ↗</button>';
  $("demo-explore").addEventListener("click",()=>showStudio("overview"));
 }catch(e){
  root.textContent="The demo session is unavailable: "+e.message;
  if(/Sign in|401|unauthorized/i.test(e.message))setDemoUI(null);
 }
}
async function submitDemoSignIn(e){
 e.preventDefault();
 const btn=$("signin-submit");btn.disabled=true;
 $("signin-error").textContent="Signing in…";
 try{
  const d=await fetchJSON("/api/demo-auth/login",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({email:$("signin-email").value,password:$("signin-password").value})
  });
  $("signin-password").value="";
  setDemoUI(d.account);
  $("signin-dialog").close();
  showStudio("demo");
 }catch(err){$("signin-error").textContent="Sign-in failed: "+err.message;}
 finally{btn.disabled=false;}
}
async function signOutDemo(){
 try{await fetchJSON("/api/demo-auth/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});}catch(e){console.warn("Could not confirm demo sign out; retry before using a shared device.");return;}
 setDemoUI(null);
 showPublic();
}

document.addEventListener("DOMContentLoaded",async()=>{
 for(const [id,fn] of [["studio-nav",()=>showStudio()],["explore-studio",()=>showStudio()],["manifesto-studio",()=>showStudio()],["back-to-public",showPublic]])$(id).addEventListener("click",fn);
 $("open-signin").addEventListener("click",signInDialog);
 $("my-account").addEventListener("click",()=>showStudio("demo"));
 $("signout-button").addEventListener("click",signOutDemo);
 $("close-signin").addEventListener("click",()=>$("signin-dialog").close());
 $("signin-form").addEventListener("submit",submitDemoSignIn);
 $("toggle-password").addEventListener("click",()=>{const input=$("signin-password");const visible=input.type==="password";input.type=visible?"text":"password";$("toggle-password").textContent=visible?"Hide":"Show";});
 document.querySelectorAll("[data-demo-email]").forEach(b=>b.addEventListener("click",()=>{
  $("signin-email").value=b.dataset.demoEmail;
  document.querySelectorAll("[data-demo-email]").forEach(x=>x.classList.toggle("selected",x===b));
  $("signin-password").focus();
 }));
 await restoreDemoSession();
 $("nav-book").addEventListener("click",()=>{showPublic();$("artists").scrollIntoView({behavior:"smooth"});});
 document.querySelectorAll(".studio-tab").forEach(tab=>tab.addEventListener("click",()=>showStudio(tab.dataset.panel)));
 $("artist-search").addEventListener("input",renderRoster);
 document.querySelectorAll("[data-filter]").forEach(chip=>chip.addEventListener("click",()=>{
  filter=chip.dataset.filter;document.querySelectorAll("[data-filter]").forEach(c=>c.classList.toggle("selected",c===chip));renderRoster();
 }));
 $("close-dialog").addEventListener("click",()=>$("booking-dialog").close());
 $("booking-dialog").addEventListener("close",resetBookingFields);
 $("booking-form").addEventListener("submit",sendBooking);
 $("studio-artist").addEventListener("change",loadOverview);
 $("admin-form").addEventListener("submit",e=>{e.preventDefault();adminToken=$("admin-token").value.trim();$("admin-token").value="";loadEnquiries();});
 $("ai-form").addEventListener("submit",askAI);
 window.addEventListener("popstate",()=>location.pathname==="/studio"?showStudio():showPublic());
 try{
  const d=await fetchJSON("/api/artists");artists=d.artists;
  renderRoster();
  for(const id of ["studio-artist","ai-artist"])$(id).innerHTML=artists.map(a=>'<option value="'+esc(a.slug)+'">'+esc(a.stage_name)+'</option>').join("");
  if(location.pathname==="/studio")showStudio();
 }catch(err){
  publicPreviewOnly=true;
  artists=staticDemoArtists;
  renderRoster();
  for(const id of ["studio-artist","ai-artist"])$(id).innerHTML=artists.map(a=>'<option value="'+esc(a.slug)+'">'+esc(a.stage_name)+'</option>').join("");
  $("artist-load-error").hidden=false;
  $("artist-load-error").textContent="Public preview mode: live database features and bookings are temporarily unavailable. This roster is fictional.";
  if(location.pathname==="/studio")showStudio();
 }
});
