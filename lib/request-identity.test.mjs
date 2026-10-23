import test from "node:test";
import assert from "node:assert/strict";
import {requestClientIp} from "./request-identity.mjs";
const req=(xff,remote="10.0.0.4")=>({socket:{remoteAddress:remote},headers:{"x-forwarded-for":xff}});
test("ignores forwarded header without trusted reverse proxy",()=>assert.equal(requestClientIp(req("203.0.113.9"),"0"),"10.0.0.4"));
test("single proxy uses nearest appended valid IP",()=>assert.equal(requestClientIp(req("198.51.100.99, 203.0.113.4"),"1"),"203.0.113.4"));
test("invalid forwarded address falls back to socket",()=>assert.equal(requestClientIp(req("198.51.100.99, fake"),"1"),"10.0.0.4"));
test("missing header falls back to socket",()=>assert.equal(requestClientIp(req(undefined),"1"),"10.0.0.4"));
test("IPv6 forwarded address supported",()=>assert.equal(requestClientIp(req("2001:db8::10"),"1"),"2001:db8::10"));
