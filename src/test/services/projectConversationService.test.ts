import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProjectNotification } from "@/services/engagementService";
import {
  getProjectConversationsForUser,
  parseCommissionIdFromTargetPath,
} from "@/services/projectConversationService";
import { sendProjectMessage } from "@/services/projectMessageService";

const clientUser = {
  id: "client-1",
  role: "client" as const,
  nickname: "甲方",
};

describe("projectConversationService", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups project messages and notifications by commission for the current user", async () => {
    vi.setSystemTime(new Date("2026-06-01T08:00:00.000Z"));
    await sendProjectMessage({
      commissionId: 42,
      senderId: "client-1",
      senderName: "甲方",
      senderRole: "client",
      recipientId: "aigcer-1",
      recipientName: "乙方",
      recipientRole: "aigcer",
      body: "请确认首版交付。",
    });

    vi.setSystemTime(new Date("2026-06-01T08:01:00.000Z"));
    createProjectNotification({
      title: "交付节点待确认",
      description: "乙方提交了首版交付。",
      targetPath: "/commissions/42",
      recipientId: "client-1",
      recipientRole: "client",
      priority: "high",
    });

    vi.setSystemTime(new Date("2026-06-01T08:02:00.000Z"));
    await sendProjectMessage({
      commissionId: 42,
      senderId: "aigcer-1",
      senderName: "乙方",
      senderRole: "aigcer",
      recipientId: "client-1",
      recipientName: "甲方",
      recipientRole: "client",
      body: "已补交付。",
    });

    const conversations = await getProjectConversationsForUser(clientUser);

    expect(conversations).toHaveLength(1);
    expect(conversations[0]).toMatchObject({
      commissionId: 42,
      title: "项目 #42",
      targetPath: "/commissions/42",
      lastKind: "message",
      lastPreview: "乙方: 已补交付。",
      messageCount: 2,
      notificationCount: 1,
      unreadCount: 1,
      priority: "high",
      participantNames: ["乙方"],
    });
    expect(conversations[0].unreadNotificationIds).toHaveLength(1);
  });

  it("keeps legacy project notices but ignores non-project and unrelated notices", async () => {
    vi.setSystemTime(new Date("2026-06-01T08:00:00.000Z"));
    createProjectNotification({
      title: "旧版项目通知",
      description: "没有收件人的旧通知仍然应该出现在项目会话中。",
      targetPath: "/commissions/77?tab=delivery",
    });
    createProjectNotification({
      title: "非项目通知",
      description: "这个入口不能聚合到项目会话。",
      targetPath: "/messages",
    });
    createProjectNotification({
      title: "其他用户通知",
      description: "这个通知属于另一位甲方。",
      targetPath: "/commissions/88",
      recipientId: "client-2",
    });

    const conversations = await getProjectConversationsForUser(clientUser);

    expect(conversations.map((item) => item.commissionId)).toEqual([77]);
    expect(conversations[0]).toMatchObject({
      notificationCount: 1,
      unreadCount: 1,
      lastPreview: "没有收件人的旧通知仍然应该出现在项目会话中。",
    });
  });

  it("parses commission ids from project target paths", () => {
    expect(parseCommissionIdFromTargetPath("/commissions/12")).toBe(12);
    expect(parseCommissionIdFromTargetPath("/commissions/12?tab=review")).toBe(12);
    expect(parseCommissionIdFromTargetPath("/commissions/12#messages")).toBe(12);
    expect(parseCommissionIdFromTargetPath("/messages")).toBeNull();
  });
});
