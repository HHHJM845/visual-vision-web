import { expect, test as base, type Page } from "@playwright/test";

type Role = "client" | "aigcer" | "admin";

export interface E2EUser {
  id: string;
  email: string;
  phone: string;
  nickname: string;
  role: Role;
  adminRole?: "super_admin" | "operator";
  verificationStatus: "none" | "pending" | "verified" | "rejected" | "needs_changes";
  clientVerificationType?: "realname" | "enterprise";
  createdAt: string;
  aigcerProfile?: {
    bio: string;
    styles: string[];
    tools: string[];
    portfolio: Array<{
      id: string;
      title: string;
      description: string;
      imageUrl: string;
    }>;
  };
}

export const clientUser: E2EUser = {
  id: "demo-client",
  email: "823760642@qq.com",
  phone: "13800000000",
  nickname: "柚柚酒",
  role: "client",
  verificationStatus: "verified",
  clientVerificationType: "realname",
  createdAt: "2026-04-01T08:00:00.000Z",
};

export const aigcerUser: E2EUser = {
  id: "demo-aigcer",
  email: "aigcer@visionai.demo",
  phone: "13900000000",
  nickname: "星河影像",
  role: "aigcer",
  verificationStatus: "verified",
  createdAt: "2026-04-02T08:00:00.000Z",
  aigcerProfile: {
    bio: "擅长品牌宣传片、概念影像与角色动态短片，熟悉 Runway、Kling、ComfyUI 工作流。",
    styles: ["科幻未来", "写实渲染", "赛博朋克"],
    tools: ["Runway", "Kling", "ComfyUI"],
    portfolio: [
      {
        id: "pf-1",
        title: "赛博品牌片",
        description: "科技产品发布视觉短片",
        imageUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600&h=600&fit=crop",
      },
    ],
  },
};

export const adminUser: E2EUser = {
  id: "admin-hhhjm",
  email: "HHHJM",
  phone: "",
  nickname: "HHHJM",
  role: "admin",
  adminRole: "super_admin",
  verificationStatus: "verified",
  createdAt: "2026-05-14T00:00:00.000Z",
};

export const test = base.extend<{ loginAs: (user: E2EUser | null, storage?: Record<string, unknown>) => Promise<void> }>({
  loginAs: async ({ page }, use) => {
    await use(async (user, storage = {}) => {
      await seedStorage(page, {
        "visionai.currentUser": user,
        "visionai.users": [adminUser, clientUser, aigcerUser],
        ...storage,
      });
    });
  },
});

export { expect };

export async function seedStorage(page: Page, storage: Record<string, unknown>) {
  await page.addInitScript((entries) => {
    window.localStorage.clear();
    Object.entries(entries).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      window.localStorage.setItem(key, JSON.stringify(value));
    });
  }, storage);
}

export async function clearStorage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}

export function acceptedDemoApplication() {
  return {
    id: "app-e2e-accepted",
    commissionId: 0,
    aigcerId: aigcerUser.id,
    aigcerNickname: aigcerUser.nickname,
    message: "我做过同类科技品牌片，可先提供 2 版视觉方向和 15 秒样片。",
    expectedPrice: "¥6800",
    status: "accepted",
    appliedAt: "2026-06-05T08:00:00.000Z",
  };
}
