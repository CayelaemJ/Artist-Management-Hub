import {test} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";
import {APPROVE_VERIFIED_ACCOUNT_SQL} from "../lib/account-approval.mjs";

test("management approval cannot bypass email verification; verified accounts can be approved",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon not configured");return;}
 const url=new URL(process.env.DATABASE_URL);
 for(const p of ["sslmode","sslcert","sslkey","sslrootcert"])url.searchParams.delete(p);
 const client=new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await client.connect();
 try{
  await client.query("BEGIN");
  try{
   const email="approval-qa-"+crypto.randomBytes(8).toString("hex")+"@cabo.test";
   const inserted=await client.query("INSERT INTO hub_accounts(email,password_hash,display_name,role) VALUES($1,$2,$3,'artist') RETURNING id,email_verified_at,verified_at",[email,"test-fixture-no-login","Approval QA"]);
   const id=inserted.rows[0].id;
   assert.equal(inserted.rows[0].email_verified_at,null);
   assert.equal(inserted.rows[0].verified_at,null);
   const denied=await client.query(APPROVE_VERIFIED_ACCOUNT_SQL,[id]);
   assert.equal(denied.rowCount,0,"Management approval must not implicitly verify the email");
   const pending=await client.query("SELECT email_verified_at,verified_at FROM hub_accounts WHERE id=$1",[id]);
   assert.equal(pending.rows[0].email_verified_at,null);
   assert.equal(pending.rows[0].verified_at,null);
   await client.query("UPDATE hub_accounts SET email_verified_at=now() WHERE id=$1",[id]);
   const approved=await client.query(APPROVE_VERIFIED_ACCOUNT_SQL,[id]);
   assert.equal(approved.rowCount,1,"An email-verified account may receive separate approval");
   assert.ok(approved.rows[0].verified_at);
   assert.ok(approved.rows[0].email_verified_at);
   const repeat=await client.query(APPROVE_VERIFIED_ACCOUNT_SQL,[id]);
   assert.equal(repeat.rowCount,0,"Approval is idempotent and cannot be repeated");
  }finally{await client.query("ROLLBACK");}
 }finally{await client.end();}
});
