import {test} from "node:test";import assert from "node:assert/strict";
import {localCareerGuidance} from "../lib/advice.mjs";
test("offline advice is explicit non-AI and makes no real reputation claims",()=>{
 const a={stage_name:"Fictional Artist",pr_factors:[71,70,89,82,73,55,74],health_factors:[84,80,75,66,85]};
 const out=localCareerGuidance(a,74,78);
 assert.match(out,/not generative AI/);assert.match(out,/fictional/);assert.match(out,/Community engagement/i);
 assert.throws(()=>localCareerGuidance({...a,pr_factors:[]},75,80),/unavailable/);
});
