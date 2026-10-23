import {test} from "node:test";
import assert from "node:assert/strict";
import {retryDelaySeconds,sendResendEmail} from "../lib/email-outbox.mjs";
test("email retry backoff increases and stays bounded",()=>{
 assert.equal(retryDelaySeconds(1),60);
 assert.equal(retryDelaySeconds(2),120);
 assert.equal(retryDelaySeconds(3),240);
 assert.equal(retryDelaySeconds(10),3600);
 assert.throws(()=>retryDelaySeconds(0),/Invalid/);
});
test("email cannot be sent without provider configuration",async()=>{
 await assert.rejects(sendResendEmail({apiKey:"",from:"",to:"",subject:"",body:"",idempotencyKey:""}),/provider configuration/);
});
