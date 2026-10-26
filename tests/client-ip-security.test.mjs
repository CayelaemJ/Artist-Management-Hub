import test from "node:test";
import assert from "node:assert/strict";
import { clientIp } from "../lib/client-ip.mjs";
const req = (headers) => ({headers,socket:{remoteAddress:"10.0.0.20"}});
test("untrusted X-Forwarded-For cannot change throttling identity",()=>{
  assert.equal(clientIp(req({"x-forwarded-for":"198.51.100.8"}),"0"),"10.0.0.20");
  assert.equal(clientIp(req({"x-forwarded-for":"198.51.100.8"}),undefined),"10.0.0.20");
});
test("one trusted append-style proxy uses observed rightmost client",()=>{
  assert.equal(clientIp(req({"x-forwarded-for":"203.0.113.7, 198.51.100.24"}),"1"),"198.51.100.24");
});
test("proxy with single forwarded client works",()=>{
  assert.equal(clientIp(req({"x-forwarded-for":"198.51.100.24"}),"1"),"198.51.100.24");
});
test("missing forwarded address falls back to remote socket",()=>{
  assert.equal(clientIp(req({}),"1"),"10.0.0.20");
});
