import { beforeEach, describe, expect, it } from "vitest";
import {
  createEventRegistration,
  createShowcaseIntent,
  listEventRegistrations,
  listNotifications,
  listShowcaseIntents,
  markNotificationRead,
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
});
