import {test} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
test("operational checks audit table persists measured checks",async t=>{
 if(!process.env.DATABASE_URL){t.skip("Neon connection unavailable");return;}
 const uri=new URL(process.env.DATABASE_URL);for(const p of ["sslmode","sslcert","sslkey","sslrootcert"])uri.searchParams.delete(p);
 const c=new pg.Client({connectionString:uri.toString(),ssl:{rejectUnauthorized:true},connectionTimeoutMillis:8000});
 await c.connect();
 try{
  await c.query("BEGIN");
  const r=await c.query("INSERT INTO hub_operational_checks(check_name,outcome,details) VALUES($1,$2,$3) RETURNING id,check_name,outcome",["test_database_probe","pass","Transaction-only QA verification"]);
  assert.equal(r.rows[0].outcome,"pass");
  const read=await c.query("SELECT check_name FROM hub_operational_checks WHERE id=$1",[r.rows[0].id]);
  assert.equal(read.rows[0].check_name,"test_database_probe");
 }finally{await c.query("ROLLBACK");await c.end();}
});
