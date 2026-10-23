import test from "node:test";
import assert from "node:assert/strict";
import {requestClientIp} from "./request-identity.mjs";

const req=(xff,remote="10.0.0.4")=>({socket:{remoteAddress:remote},headers:{"x-forwarded-for":xff}});

test("ignores forwarded header when proxy trust is disabled",()=>{
  assert.equal(requestClientIp(req("203.0.113.9"),"0"),"10.0.0.4");
});
test("trusts the nearest appended address, not a spoofed leftmost address",()=>{
  assert.equal(requestClientIp(req("198.51.100.99, 203.0.113.4"),"1"),"203.0.113.4");
});
test("invalid proxy-supplied IP falls back to socket",()=>{
  assert.equal(requestClientIp(req("198.51.100.99, fake"),"1"),"10.0.0.4");
});
test("missing forwarded header falls back to socket",()=>{
  assert.equal(requestClientIp(req(undefined),"1"),"10.0.0.4");
});
test("valid IPv6 address is supported",()=>{
  assert.equal(requestClientIp(req("2001:db8::10"),"1"),"2001:db8::10");
});
test("without trust, forged address never overrides remote address",()=>{
  assert.equal(requestClientIp(req("192.0.2.50","127.0.0.1"),"0"),"127.0.0.1");
});
