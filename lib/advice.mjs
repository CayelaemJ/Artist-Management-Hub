const PR=["Public sentiment","Press coverage","Professional conduct","Partnerships","Audience trust","Community engagement","Communication"];
const HEALTH=["Income stability","Booking momentum","Audience development","Professional skills","Sustainable workload"];
export function localCareerGuidance(artist,prScore,careerScore){
 const safe=Array.isArray(artist?.pr_factors)&&Array.isArray(artist?.health_factors);
 if(!safe||artist.pr_factors.length!==7||artist.health_factors.length!==5)throw Error("Fictional inputs unavailable");
 const low=(vals,names)=>names[vals.reduce((best,v,i)=>Number(v)<Number(vals[best])?i:best,0)];
 const pr=low(artist.pr_factors,PR),health=low(artist.health_factors,HEALTH);
 return "CABO OFFLINE GUIDANCE (not generative AI): "+artist.stage_name+" has fictional PR and Career Health indices of "+prScore+"/100 and "+careerScore+"/100. Prioritise reviewing "+pr.toLowerCase()+" with the artist, then create one measurable development action around "+health.toLowerCase()+". Review upcoming bookings, costs and actual paid income separately. Use consented, attributable evidence rather than judging a person from automated sentiment. This is a demonstration suggestion, not a real-world conclusion.";
}
