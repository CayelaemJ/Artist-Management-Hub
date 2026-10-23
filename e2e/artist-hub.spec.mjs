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
});
