import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectMessagesByCommission, sendProjectMessage } from "@/services/projectMessageService";

describe("projectMessageService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:project-message-file"),
    });
  });

  it("rejects empty messages without attachments", async () => {
    await expect(sendProjectMessage({
      commissionId: 1,
      senderId: "client-1",
      senderName: "甲方",
      senderRole: "client",
      recipientId: "aigcer-1",
      recipientName: "乙方",
      recipientRole: "aigcer",
      body: "   ",
    })).rejects.toThrow("请填写消息内容或上传附件");
  });

  it("stores project messages by commission", async () => {
    await sendProjectMessage({
      commissionId: 1,
      senderId: "client-1",
      senderName: "甲方",
      senderRole: "client",
      recipientId: "aigcer-1",
      recipientName: "乙方",
      recipientRole: "aigcer",
      body: "请确认首版样片节点。",
    });
    await sendProjectMessage({
      commissionId: 2,
      senderId: "client-1",
      senderName: "甲方",
      senderRole: "client",
      recipientId: "aigcer-2",
      recipientName: "乙方2",
      recipientRole: "aigcer",
      body: "另一个项目。",
    });

    const messages = await getProjectMessagesByCommission(1);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      commissionId: 1,
      senderName: "甲方",
      recipientName: "乙方",
      body: "请确认首版样片节点。",
    });
  });

  it("stores attachment metadata for local project files", async () => {
    const file = new File(["demo"], "brief.pdf", { type: "application/pdf" });

    const message = await sendProjectMessage({
      commissionId: 1,
      senderId: "aigcer-1",
      senderName: "乙方",
      senderRole: "aigcer",
      recipientId: "client-1",
      recipientName: "甲方",
      recipientRole: "client",
      body: "",
      file,
    });

    expect(message.attachment).toMatchObject({
      fileName: "brief.pdf",
      fileUrl: "blob:project-message-file",
      mimeType: "application/pdf",
      size: 4,
    });
    await expect(getProjectMessagesByCommission(1)).resolves.toMatchObject([
      { attachment: { fileName: "brief.pdf" } },
    ]);
  });
});
