import {test,expect} from "@playwright/test";

test("public landing and artist dashboard display real Neon demo data",async({page})=>{
 await page.goto("/");
 await expect(page.locator("body")).toContainText("CABO ARTIST HUB");
 await page.locator("#studio-nav").click();
 await expect(page.locator("#studio-view")).toBeVisible();
 await expect(page.locator("#studio-artist option")).toHaveCount(8);
 await expect(page.locator("#overview-content")).toContainText("Reputation & PR");
 await expect(page.locator("#overview-content")).toContainText("Career Health");
 await expect(page.locator("#overview-content")).toContainText("SYNTHETIC");
});
test("demo customer can sign in, view fictional workspace, and sign out",async({page})=>{
 await page.goto("/");
 await page.locator("#open-signin").click();
 await expect(page.locator("#signin-dialog")).toBeVisible();
 await page.locator("#signin-email").fill("customer.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-panel")).toBeVisible();
 await expect(page.locator("#demo-booking-area")).toBeVisible();
 await page.locator("#signout-button").click();
 await expect(page.locator("#public-view")).toBeVisible();
});
test("manager can see separated fictional booking workflow",async({page})=>{
 await page.goto("/");
 await page.locator("#open-signin").click();
 await page.locator("#signin-email").fill("manager.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-booking-area")).toBeVisible();
 await expect(page.locator("#demo-booking-list")).toContainText(/Demo enquiry pipeline|No demo enquiries/);
});
test("optional write test: create and advance one fictional booking",async({page})=>{
 test.skip(process.env.E2E_WRITE_DEMO!=="1","Explicit E2E_WRITE_DEMO=1 required; avoids accumulating CI bookings");
 await page.goto("/");
 await page.locator("#open-signin").click();
 await page.locator("#signin-email").fill("manager.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-booking-area")).toBeVisible();
 await page.locator("#demo-booking-type").fill("Automated QA demo — fictional only");
 await page.locator("#demo-booking-form button[type=submit]").click();
 await expect(page.locator("#demo-booking-message")).toContainText("Saved to Neon");
 await expect(page.locator("#demo-booking-list")).toContainText("Automated QA demo");
 const booking=page.locator("#demo-booking-list article.enquiry-item").filter({hasText:"Automated QA demo"}).first();
 await expect(booking.locator("select[data-demo-next]")).toBeVisible();
 await booking.locator("select[data-demo-next]").selectOption("availability_check");
 await booking.locator("button[data-demo-update]").click();
 await expect(page.locator("#demo-booking-message")).toContainText("advanced to availability check");
 await expect(page.locator("#demo-booking-list article.enquiry-item").filter({hasText:"Automated QA demo"}).first()).toContainText("availability_check");
});

test("race regression: artist roster loading cannot take focus away from sign-in workspace",async({page})=>{
 await page.route("**/api/artists",async route=>{
  const response=await route.fetch();
  await new Promise(resolve=>setTimeout(resolve,1400));
  await route.fulfill({response});
 });
 await page.goto("/");
 await page.locator("#open-signin").click();
 await page.locator("#signin-email").fill("artist.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-panel")).toBeVisible();
 await expect(page.locator("#demo-workspace-content")).toContainText("SYNTHETIC DEMONSTRATION");
 await expect(page.locator("#studio-artist option")).toHaveCount(8);
 await expect(page.locator("#demo-panel")).toBeVisible();
 await expect(page.locator("#overview-panel")).toBeHidden();
});


test("public and fictional demo sessions cannot read superadmin operations",async({page})=>{
 await page.goto("/");
 const privatePaths=["/api/ops/readiness","/api/ops/summary","/api/ops/analytics","/api/ops/finance","/api/ops/accounts","/api/admin/enquiries"];
 for(const path of privatePaths){
  const result=await page.request.get(path);
  expect([401,403],path+" must refuse anonymous access").toContain(result.status());
 }
 await page.locator("#open-signin").click();
 await page.locator("#signin-email").fill("manager.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-panel")).toBeVisible();
 for(const path of privatePaths){
  const result=await page.request.get(path);
  expect([401,403],path+" must refuse demo-manager access").toContain(result.status());
 }
});

test("manager booking form waits for artist choices even if initial roster is delayed",async({page})=>{
 await page.route("**/api/artists",async route=>{
  const response=await route.fetch();
  await new Promise(resolve=>setTimeout(resolve,1200));
  await route.fulfill({response});
 });
 await page.goto("/");
 await page.locator("#open-signin").click();
 await page.locator("#signin-email").fill("manager.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-booking-area")).toBeVisible();
 await expect(page.locator("#demo-booking-artist option")).toHaveCount(8);
 await expect(page.locator("#demo-booking-artist")).toHaveValue(/.+/);
});

test("mobile public and manager dashboard have usable touch controls",async({page})=>{
 await page.setViewportSize({width:375,height:812});
 await page.goto("/");
 await expect(page.locator("#open-signin")).toBeVisible();
 await page.locator("#open-signin").click();
 await expect(page.locator("#signin-dialog")).toBeVisible();
 await page.locator("#signin-email").fill("manager.demo@cabo.test");
 await page.locator("#signin-password").fill("12345");
 await page.locator("#signin-submit").click();
 await expect(page.locator("#demo-booking-area")).toBeVisible();
 await expect(page.locator("#demo-booking-artist option")).toHaveCount(8);
 await expect(page.locator("#demo-booking-form button[type=submit]")).toBeVisible();
});
test("production demo cookie uses HttpOnly, Secure and SameSite",async({request})=>{
 const response=await request.post("/api/demo-auth/login",{data:{email:"artist.demo@cabo.test",password:"12345"}});
 expect(response.status()).toBe(200);
 const cookie=response.headers()["set-cookie"]||"";
 expect(cookie).toMatch(/HttpOnly/i);
 expect(cookie).toMatch(/Secure/i);
 expect(cookie).toMatch(/SameSite=Strict/i);
});
