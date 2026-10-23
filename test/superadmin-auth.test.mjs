import {test} from "node:test";import assert from "node:assert/strict";import crypto from "node:crypto";
import {authenticate,credentialConfigured,superadminStart,superadminUser,superadminEnd,adminCookie} from "../lib/superadmin-auth.mjs";
test("superadmin credentials verified with scrypt hash, no plaintext secrets in code",()=>{
 const beforeU=process.env.SUPERADMIN_USERNAME,beforeH=process.env.SUPERADMIN_PASSWORD_HASH;
 try{
  const salt=crypto.randomBytes(16),password=crypto.randomBytes(24).toString("hex");
  process.env.SUPERADMIN_USERNAME="qa-superadmin";
  process.env.SUPERADMIN_PASSWORD_HASH=salt.toString("hex")+":"+crypto.scryptSync(password,salt,32).toString("hex");
  assert.equal(credentialConfigured(),true);
  assert.equal(authenticate("qa-superadmin",password),true);
  assert.equal(authenticate("qa-superadmin","wrong"),false);
  assert.equal(authenticate("not-admin",password),false);
  const token=superadminStart("qa-superadmin");
  const req={headers:{cookie:"cabo_superadmin="+token}};
  assert.equal(superadminUser(req).role,"superadmin");
  assert.match(adminCookie(token),/HttpOnly/);
  superadminEnd(req);
  assert.equal(superadminUser(req),null);
 }finally{
  if(beforeU===undefined)delete process.env.SUPERADMIN_USERNAME;else process.env.SUPERADMIN_USERNAME=beforeU;
  if(beforeH===undefined)delete process.env.SUPERADMIN_PASSWORD_HASH;else process.env.SUPERADMIN_PASSWORD_HASH=beforeH;
 }
});
