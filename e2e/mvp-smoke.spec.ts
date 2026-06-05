import { expect, test, acceptedDemoApplication, aigcerUser, clientUser } from "./fixtures";

test.describe("Demo MVP smoke", () => {
  test("guest is prompted to log in before publishing a commission", async ({ page, loginAs }) => {
    await loginAs(null);

    await page.goto("/commissions/new");

    await expect(page.getByText("请先登录")).toBeVisible();
    await expect(page.getByRole("button", { name: "去登录" })).toBeVisible();
  });

  test("client can publish a commission, see recommended creators, and invite one", async ({ page, loginAs }) => {
    await loginAs(clientUser);

    await page.goto("/commissions/new");
    await page.getByPlaceholder("简明描述你的需求，如「企业品牌AI宣传片制作」").fill("E2E品牌AI宣传片制作");
    await page.getByPlaceholder("详细描述影片风格、时长、用途、参考案例等...").fill(
      "需要一支60秒科技品牌宣传片，包含产品展示、企业文化、结尾口号和适合发布会播放的现代视觉风格。",
    );
    await page.getByText("请选择").click();
    await page.getByRole("option", { name: "商业宣传片" }).click();
    await page.getByPlaceholder("如：3000").fill("3000");
    await page.getByPlaceholder("如：8000").fill("8000");
    await page.locator('input[type="date"]').fill("2027-07-01");
    await page.getByPlaceholder("如：MP4、MOV").fill("MP4");

    await page.getByRole("button", { name: "发布项目" }).click();

    await expect(page).toHaveURL(/\/creators\?commissionId=\d+/);
    await expect(page.getByRole("heading", { name: "系统已为这条需求推荐候选创作者" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "推荐候选创作者", exact: true })).toBeVisible();

    const inviteButtons = page.getByRole("button", { name: /邀约合作/ });
    await expect(inviteButtons.first()).toBeVisible();
    await inviteButtons.first().click();

    await expect.poll(async () => page.evaluate(() => {
      const applications = JSON.parse(window.localStorage.getItem("visionai.applications") || "[]");
      return applications.some((application: { message?: string; status?: string }) => (
        application.status === "pending" && application.message?.startsWith("项目邀约：")
      ));
    })).toBe(true);
  });

  test("client project workspace exposes contract, escrow, delivery, and dispute panels", async ({ page, loginAs }) => {
    await loginAs(clientUser, {
      "visionai.applications": [acceptedDemoApplication()],
    });

    await page.goto("/commissions/0");

    await expect(page.getByRole("heading", { name: "企业品牌AI宣传片制作" })).toBeVisible();
    await expect(page.getByText("已选定 星河影像")).toBeVisible();
    await expect(page.getByRole("heading", { name: "合作合同" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "托管付款" })).toBeVisible();
    await expect(page.getByText("交付记录", { exact: true })).toBeVisible();
    await expect(page.getByText("争议处理", { exact: true })).toBeVisible();
  });

  test("messages center aggregates project conversations from messages and notifications", async ({ page, loginAs }) => {
    await loginAs(clientUser, {
      "visionai.projectMessages": [
        {
          id: "message-e2e-1",
          commissionId: 0,
          senderId: aigcerUser.id,
          senderName: aigcerUser.nickname,
          senderRole: "aigcer",
          recipientId: clientUser.id,
          recipientName: clientUser.nickname,
          recipientRole: "client",
          body: "已提交脚本初稿，请查看。",
          createdAt: "2026-06-05T09:00:00.000Z",
        },
      ],
      "visionai.notifications": [
        {
          id: "notice-e2e-1",
          type: "project-update",
          title: "交付节点待确认",
          description: "星河影像提交了脚本初稿。",
          createdAt: "2026-06-05T09:05:00.000Z",
          read: false,
          targetPath: "/commissions/0",
          recipientId: clientUser.id,
          recipientRole: "client",
          priority: "high",
        },
      ],
    });

    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "消息中心" })).toBeVisible();
    await expect(page.getByText("项目会话").first()).toBeVisible();
    await expect(page.getByText("企业品牌AI宣传片制作")).toBeVisible();
    await expect(page.getByRole("button", { name: /企业品牌AI宣传片制作/ })).toContainText("星河影像提交了脚本初稿。");
    await expect(page.getByText("未读 1")).toBeVisible();
  });
});
