import test from "node:test";
import assert from "node:assert/strict";
import { validMutationOrigin } from "../lib/origin-guard.mjs";

const request = (headers) => ({headers});
test("legitimate production browser write with cookie and matching Origin",()=>{
  assert.equal(validMutationOrigin(request({host:"example.com",origin:"https://example.com",cookie:"cabo_account=abc"}),{production:true}),true);
});
test("cross-site and cross-scheme writes are denied",()=>{
  for(const origin of ["https://evil.example","https://example.com.evil.test","http://example.com","not-a-url"]){
    assert.equal(validMutationOrigin(request({host:"example.com",origin,cookie:"cabo_account=abc"}),{production:true}),false,origin);
  }
});
test("cookie-authenticated writes with no origin evidence are denied",()=>{
  assert.equal(validMutationOrigin(request({host:"example.com",cookie:"cabo_account=abc"}),{production:true}),false);
});
test("verified Referer fallback works for older browser clients",()=>{
  assert.equal(validMutationOrigin(request({host:"example.com",referer:"https://example.com/studio",cookie:"cabo_account=abc"}),{production:true}),true);
  assert.equal(validMutationOrigin(request({host:"example.com",referer:"https://evil.test/",cookie:"cabo_account=abc"}),{production:true}),false);
});
test("uncredentialed clients without browser origin remain supported",()=>{
  assert.equal(validMutationOrigin(request({host:"example.com"}),{production:true}),true);
});
test("unexpected origin and malformed host are not accepted",()=>{
  assert.equal(validMutationOrigin(request({host:"example.com",origin:""}),{production:true}),false);
  assert.equal(validMutationOrigin(request({host:"example.com/evil",origin:"https://example.com"}),{production:true}),false);
});
test("local development permits http same-origin",()=>{
  assert.equal(validMutationOrigin(request({host:"localhost:10000",origin:"http://localhost:10000",cookie:"cabo_demo_session=x"}),{production:false}),true);
});
