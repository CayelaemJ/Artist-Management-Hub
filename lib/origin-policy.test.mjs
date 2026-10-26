import test from "node:test";
import assert from "node:assert/strict";
import {validRequestOrigin} from "./origin-policy.mjs";
const req=(origin,site="same-origin",host="artist.example")=>({headers:{origin,host,"sec-fetch-site":site}});
test("exact secure origin accepted",()=>{
 assert.equal(validRequestOrigin(req("https://artist.example"),{NODE_ENV:"production"}),true);
});
test("cross-site and sibling domain requests denied",()=>{
 assert.equal(validRequestOrigin(req("https://artist.example","cross-site"),{NODE_ENV:"production"}),false);
 assert.equal(validRequestOrigin(req("https://artist.example","same-site"),{NODE_ENV:"production"}),false);
 assert.equal(validRequestOrigin(req("https://evil.example"),{NODE_ENV:"production"}),false);
 assert.equal(validRequestOrigin(req("http://artist.example"),{NODE_ENV:"production"}),false);
 assert.equal(validRequestOrigin(req("null"),{NODE_ENV:"production"}),false);
});
test("HTTP loopback allowed for local production-mode integration tests",()=>{
 assert.equal(validRequestOrigin(req("http://localhost:3000","same-origin","localhost:3000"),{NODE_ENV:"test"}),true);
 assert.equal(validRequestOrigin(req("http://localhost:3000","same-origin","localhost:3000"),{NODE_ENV:"production"}),true);
});
test("non-browser clients remain constrained by route authentication",()=>{
 assert.equal(validRequestOrigin(req(undefined,"none"),{NODE_ENV:"production"}),true);
 assert.equal(validRequestOrigin(req(undefined,"cross-site"),{NODE_ENV:"production"}),false);
});
