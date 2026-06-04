import { beforeEach, describe, expect, it } from "vitest";
import {
  createEventRegistration,
  createShowcaseIntent,
  listEventRegistrations,
  listNotifications,
  listNotificationsForUser,
  listShowcaseIntents,
  markNotificationRead,
  createProjectNotification,
} from "@/services/engagementService";

describe("engagementService", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores showcase intents and creates a notification", () => {
    const intent = createShowcaseIntent({
      serviceId: "s1",
      serviceTitle: "品牌AI宣传片",
      author: "云雾视觉机",
      price: 180,
      requirement: "需要一支 30 秒产品预热视频",
      contact: "wechat-demo",
    });

    expect(intent.status).toBe("pending");
    expect(listShowcaseIntents()).toHaveLength(1);
    expect(listNotifications()[0]).toMatchObject({
      type: "showcase-intent",
      read: false,
    });
  });

  it("validates required fields before saving", () => {
    expect(() =>
      createShowcaseIntent({
        serviceId: "s1",
        serviceTitle: "品牌AI宣传片",
        author: "云雾视觉机",
        price: 180,
        requirement: "",
        contact: "wechat-demo",
      })
    ).toThrow("请填写需求摘要");

    expect(listShowcaseIntents()).toHaveLength(0);
  });

  it("stores event registrations and can mark notifications read", () => {
    createEventRegistration({
      eventId: "e0",
      eventTitle: "春季品牌片挑战",
      participantName: "星河影像",
      contact: "aigcer@visionai.demo",
      workTitle: "城市光谱",
    });

    expect(listEventRegistrations()).toHaveLength(1);
    const [notice] = listNotifications();
    expect(notice.type).toBe("event-registration");

    const updated = markNotificationRead(notice.id);
    expect(updated?.read).toBe(true);
    expect(listNotifications()[0].read).toBe(true);
  });

  it("filters directed project notifications for the current user while keeping legacy notices visible", () => {
    createProjectNotification({
      title: "待签合同",
      description: "请确认合作合同。",
      targetPath: "/commissions/1",
      recipientId: "aigcer-1",
      recipientRole: "aigcer",
      actionLabel: "去签署",
      priority: "high",
    });
    createProjectNotification({
      title: "甲方待办",
      description: "请确认交付。",
      targetPath: "/commissions/2",
      recipientId: "client-1",
      recipientRole: "client",
    });
    createProjectNotification({
      title: "旧版项目通知",
      description: "兼容没有收件人的旧通知。",
      targetPath: "/commissions/3",
    });

    const notices = listNotificationsForUser({ id: "aigcer-1", role: "aigcer" });

    expect(notices.map((item) => item.title)).toEqual(["旧版项目通知", "待签合同"]);
    expect(notices[1]).toMatchObject({
      recipientId: "aigcer-1",
      recipientRole: "aigcer",
      actionLabel: "去签署",
      priority: "high",
    });
  });
});
