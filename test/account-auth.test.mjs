import {test} from "node:test";
import assert from "node:assert/strict";
import {hashPassword,verifyPassword,issueToken,tokenHash,extractAccountCookie,accountCookie,clearAccountCookie} from "../lib/account-auth.mjs";
test("real account authentication requires strong credentials",()=>{
 assert.throws(()=>hashPassword("12345"),/12/);
 const h=hashPassword("Safe-Pilot-Passphrase-2026");
 assert.equal(verifyPassword("Safe-Pilot-Passphrase-2026",h),true);
 assert.equal(verifyPassword("Wrong-Pilot-Passphrase",h),false);
 assert.equal(verifyPassword("Safe-Pilot-Passphrase-2026","invalid"),false);
});
test("account cookie tokens are random, scoped and revocable by token hash",()=>{
 const t1=issueToken(),t2=issueToken();
 assert.notEqual(t1,t2);assert.equal(t1.length,64);
 assert.notEqual(tokenHash(t1),t1);
 assert.match(accountCookie(t1),/HttpOnly/);assert.match(accountCookie(t1),/SameSite=Strict/);
 assert.equal(extractAccountCookie({headers:{cookie:"cabo_account="+t1}}),t1);
 assert.equal(extractAccountCookie({headers:{cookie:"cabo_account=invalid"}}),null);
 assert.match(clearAccountCookie(),/Max-Age=0/);
});
