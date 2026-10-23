import {test} from "node:test";import assert from "node:assert/strict";import crypto from "node:crypto";
import {verifyYocoWebhook} from "../lib/yoco-webhooks.mjs";
test("Yoco webhooks require valid raw-body HMAC and reject tampering, replays",()=>{
 const key=crypto.randomBytes(32),secret="whsec_"+key.toString("base64");
 const raw=Buffer.from('{"type":"payment.succeeded","payload":{"amount":150000,"currency":"ZAR"}}');
 const now=Math.floor(Date.now()/1000),id="evt_qa001",ts=String(now);
 const sig=crypto.createHmac("sha256",key).update(id+"."+ts+".").update(raw).digest("base64");
 const headers={"webhook-id":id,"webhook-timestamp":ts,"webhook-signature":"v1,"+sig};
 assert.equal(verifyYocoWebhook(raw,headers,secret,now),true);
 assert.equal(verifyYocoWebhook(Buffer.from(raw.toString().replace("150000","250000")),headers,secret,now),false);
 assert.equal(verifyYocoWebhook(raw,headers,secret,now+181),false);
 assert.equal(verifyYocoWebhook(raw,{...headers,"webhook-signature":"v1,forged"},secret,now),false);
 assert.equal(verifyYocoWebhook(raw,headers,"wrong-secret",now),false);
});
