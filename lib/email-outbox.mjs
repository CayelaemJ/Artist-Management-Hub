export function retryDelaySeconds(attempt){
 if(!Number.isSafeInteger(attempt)||attempt<1)throw Error("Invalid attempt number");
 return Math.min(3600,60*2**Math.min(6,attempt-1));
}
export async function sendResendEmail({apiKey,from,to,subject,body,idempotencyKey}){
 if(!apiKey||!from||!to||!subject||!body||!idempotencyKey)throw Error("Email delivery requires complete provider configuration");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const r=await fetch("https://api.resend.com/emails",{
   method:"POST",signal:controller.signal,
   headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":idempotencyKey},
   body:JSON.stringify({from,to:[to],subject,text:body})
  });
  if(!r.ok)throw Error("Provider rejected email ("+r.status+")");
  const result=await r.json();
  if(typeof result.id!=="string"||!result.id)throw Error("Provider response missing message ID");
  return result.id;
 }finally{clearTimeout(timer);}
}
