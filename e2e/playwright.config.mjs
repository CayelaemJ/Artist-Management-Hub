import {defineConfig} from "@playwright/test";
export default defineConfig({
 testDir:".",
 testMatch:"**/*.spec.mjs",
 timeout:60000,
 expect:{timeout:15000},
 retries:process.env.CI?2:0,
 workers:1,
 reporter:[["list"],["junit",{outputFile:"test-results/junit.xml"}]],
 use:{baseURL:process.env.E2E_BASE_URL||"https://cabo-artist-hub.onrender.com",headless:true,trace:"retain-on-failure"},
 projects:[{name:"chromium",use:{browserName:"chromium"}}]
});
