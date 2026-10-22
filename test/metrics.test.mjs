import {test} from "node:test";
import assert from "node:assert/strict";
import {weightedScore,PR_WEIGHTS,HEALTH_WEIGHTS,financialTotals} from "../lib/metrics.mjs";
test("pr score is weighted correctly and rejects unknown data",()=>{
 assert.equal(weightedScore([100,100,100,100,100,100,100],PR_WEIGHTS),100);
 assert.equal(weightedScore([0,0,0,0,0,0,0],PR_WEIGHTS),0);
 assert.equal(weightedScore([40],PR_WEIGHTS),null);
 assert.equal(weightedScore([null,0,0,0,0,0,0],PR_WEIGHTS),0);
 assert.equal(weightedScore([-1,0,0,0,0,0,0],PR_WEIGHTS),null);
});
test("career scores independent of raw audience size",()=>{
 assert.equal(weightedScore([80,80,80,80,80],HEALTH_WEIGHTS),80);
});
test("unpaid and confirmed fees excluded from actual revenue",()=>{
 const a=financialTotals([{status:"completed",fee_zar:10000,expense_zar:3500},{status:"confirmed",fee_zar:12000,expense_zar:0},{status:"proposed",fee_zar:99999,expense_zar:0}]);
 assert.equal(a.actualRevenue,10000);
 assert.equal(a.actualProfit,6500);
 assert.equal(a.confirmedFuture,12000);
});
