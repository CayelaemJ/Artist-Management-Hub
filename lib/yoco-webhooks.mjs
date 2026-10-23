import crypto from "node:crypto";
export function verifyYocoWebhook(raw,headers,secret,nowSeconds=Math.floor(Date.now()/1000)){
 if(!secret?.startsWith("whsec_"))return false;
 const id=String(headers["webhook-id"]||""),ts=String(headers["webhook-timestamp"]||""),sig=String(headers["webhook-signature"]||"");
 if(!/^[A-Za-z0-9_-]{4,128}$/.test(id)||!/^\d{10}$/.test(ts)||Math.abs(nowSeconds-Number(ts))>180)return false;
 const decoded=Buffer.from(secret.slice(6),"base64");
 if(decoded.length<16)return false;
 const signed=Buffer.concat([Buffer.from(id+"."+ts+"."),Buffer.isBuffer(raw)?raw:Buffer.from(String(raw))]);
 const expected=crypto.createHmac("sha256",decoded).update(signed).digest();
 for(const part of sig.split(" ")){
  const [version,signature]=part.split(",");
  if(version!=="v1"||!signature)continue;
  const supplied=Buffer.from(signature,"base64");
  if(supplied.length===expected.length&&crypto.timingSafeEqual(supplied,expected))return true;
 }
 return false;
}
