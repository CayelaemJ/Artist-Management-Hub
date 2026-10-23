import {test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
test("account-scoped dashboard tables exist and never join artists without membership",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon not configured");return;}
 const url=new URL(process.env.DATABASE_URL);for(const p of ["sslmode","sslcert","sslkey","sslrootcert"])url.searchParams.delete(p);
 const client=new pg.Client({connectionString:url.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await client.connect();
 try{
  const tables=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[])",[["hub_accounts","hub_sessions","artist_account_memberships","booking_contracts","booking_invoices","hub_notifications","social_provider_connections"]]);
  assert.equal(tables.rows.length,7);
  const result=await client.query("SELECT a.id FROM artist_account_memberships m JOIN artists a ON a.id=m.artist_id WHERE m.account_id=$1 AND a.slug=$2",["00000000-0000-0000-0000-000000000000","echo-dune"]);
  assert.equal(result.rowCount,0);
 }finally{await client.end();}
});
