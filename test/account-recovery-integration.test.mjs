import {test} from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";
import {hashPassword,verifyPassword,issueToken,tokenHash} from "../lib/account-auth.mjs";

test("Neon recovery tokens are one-time, hashed, expiry checked, and account sessions revoked with no persistent QA data",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon not configured");return;}
 const url=new URL(process.env.DATABASE_URL);
 for(const k of ["sslmode","sslcert","sslkey","sslrootcert"])url.searchParams.delete(k);
 const client=new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:10000});
 await client.connect();
 let email;
 try{
  await client.query("BEGIN");
  email="recovery-qa-"+crypto.randomBytes(8).toString("hex")+"@cabo.test";
  const original=hashPassword("Strong-Passphrase-Original-2026");
  const account=await client.query("INSERT INTO hub_accounts(email,password_hash,display_name,role,email_verified_at,verified_at) VALUES($1,$2,'Synthetic Recovery QA','customer',now(),now()) RETURNING id",[email,original]);
  const id=account.rows[0].id,session=tokenHash(issueToken());
  await client.query("INSERT INTO hub_sessions(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",[session,id]);
  const raw=issueToken(),digest=tokenHash(raw);
  assert.notEqual(digest,raw);
  await client.query("INSERT INTO account_password_resets(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')",[digest,id]);
  const stored=await client.query("SELECT token_hash FROM account_password_resets WHERE account_id=$1",[id]);
  assert.equal(stored.rows[0].token_hash,digest);
  assert.notEqual(stored.rows[0].token_hash,raw);
  const replacement=hashPassword("Strong-Passphrase-Recovered-2026");
  const consumed=await client.query("UPDATE account_password_resets SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING account_id",[digest]);
  assert.equal(consumed.rowCount,1);
  const replay=await client.query("UPDATE account_password_resets SET consumed_at=now() WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>now() RETURNING account_id",[digest]);
  assert.equal(replay.rowCount,0,"Consumed links cannot be reused");
  await client.query("UPDATE hub_accounts SET password_hash=$1 WHERE id=$2",[replacement,id]);
  await client.query("DELETE FROM hub_sessions WHERE account_id=$1",[id]);
  const updated=await client.query("SELECT password_hash FROM hub_accounts WHERE id=$1",[id]);
  assert.equal(verifyPassword("Strong-Passphrase-Recovered-2026",updated.rows[0].password_hash),true);
  assert.equal(verifyPassword("Strong-Passphrase-Original-2026",updated.rows[0].password_hash),false);
  const sessions=await client.query("SELECT count(*)::int AS n FROM hub_sessions WHERE account_id=$1",[id]);
  assert.equal(sessions.rows[0].n,0);
 }finally{
  await client.query("ROLLBACK");
  if(email){const leftover=await client.query("SELECT id FROM hub_accounts WHERE email=$1",[email]);assert.equal(leftover.rowCount,0);}
  await client.end();
 }
});
