import { getCommissions } from "@/services/commissionService";
import { listNotificationsForUser, type NotificationItem } from "@/services/engagementService";
import { getProjectMessagesForUser, type ProjectMessage } from "@/services/projectMessageService";
import type { Commission } from "@/types/commission";
import type { User } from "@/types/user";

export interface ProjectConversation {
  commissionId: number;
  title: string;
  targetPath: string;
  latestAt: string;
  lastPreview: string;
  lastKind: "message" | "notification";
  priority: "normal" | "high";
  messageCount: number;
  notificationCount: number;
  unreadCount: number;
  unreadNotificationIds: string[];
  participantNames: string[];
}

type ConversationUser = Pick<User, "id" | "role" | "nickname">;

interface ConversationDraft {
  commissionId: number;
  messages: ProjectMessage[];
  notifications: NotificationItem[];
  unreadNotificationIds: string[];
  participantNames: Set<string>;
  latestAt: string;
  lastPreview: string;
  lastKind: ProjectConversation["lastKind"];
  priority: ProjectConversation["priority"];
}

export function parseCommissionIdFromTargetPath(targetPath?: string): number | null {
  const match = targetPath?.match(/^\/commissions\/(\d+)(?:$|[/?#])/);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function timeValue(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function newestFirst(a: ProjectConversation, b: ProjectConversation) {
  return timeValue(b.latestAt) - timeValue(a.latestAt);
}

function considerActivity(
  draft: ConversationDraft,
  latestAt: string,
  lastPreview: string,
  lastKind: ProjectConversation["lastKind"],
) {
  if (!draft.latestAt || timeValue(latestAt) >= timeValue(draft.latestAt)) {
    draft.latestAt = latestAt;
    draft.lastPreview = lastPreview;
    draft.lastKind = lastKind;
  }
}

function messagePreview(message: ProjectMessage, user: ConversationUser) {
  const actor = message.senderId === user.id ? "我" : message.senderName;
  const content = message.body || (
    message.attachment ? `发送了附件：${message.attachment.fileName}` : "发送了一条项目消息"
  );
  return `${actor}: ${content}`;
}

function notificationPreview(notification: NotificationItem) {
  return notification.description || notification.title;
}

function createDraft(commissionId: number): ConversationDraft {
  return {
    commissionId,
    messages: [],
    notifications: [],
    unreadNotificationIds: [],
    participantNames: new Set<string>(),
    latestAt: "",
    lastPreview: "",
    lastKind: "notification",
    priority: "normal",
  };
}

function addMessage(draft: ConversationDraft, message: ProjectMessage, user: ConversationUser) {
  draft.messages.push(message);
  if (message.senderId !== user.id) draft.participantNames.add(message.senderName);
  if (message.recipientId !== user.id) draft.participantNames.add(message.recipientName);
  considerActivity(draft, message.createdAt, messagePreview(message, user), "message");
}

function addNotification(draft: ConversationDraft, notification: NotificationItem) {
  draft.notifications.push(notification);
  if (!notification.read) draft.unreadNotificationIds.push(notification.id);
  if (notification.priority === "high" && !notification.read) draft.priority = "high";
  considerActivity(draft, notification.createdAt, notificationPreview(notification), "notification");
}

export async function getProjectConversationsForUser(user: ConversationUser | null): Promise<ProjectConversation[]> {
  if (!user) return [];

  const [commissions, messages] = await Promise.all([
    getCommissions().catch(() => [] as Commission[]),
    getProjectMessagesForUser(user.id).catch(() => [] as ProjectMessage[]),
  ]);
  const titleByCommissionId = new Map<number, string>(
    commissions.map((commission) => [commission.id, commission.title] as const)
  );
  const grouped = new Map<number, ConversationDraft>();

  function draftFor(commissionId: number) {
    const existing = grouped.get(commissionId);
    if (existing) return existing;
    const draft = createDraft(commissionId);
    grouped.set(commissionId, draft);
    return draft;
  }

  messages.forEach((message) => addMessage(draftFor(message.commissionId), message, user));

  listNotificationsForUser(user)
    .filter((notification) => notification.type === "project-update")
    .forEach((notification) => {
      const commissionId = parseCommissionIdFromTargetPath(notification.targetPath);
      if (commissionId === null) return;
      addNotification(draftFor(commissionId), notification);
    });

  return [...grouped.values()]
    .filter((draft) => draft.latestAt)
    .map((draft) => ({
      commissionId: draft.commissionId,
      title: titleByCommissionId.get(draft.commissionId) ?? `项目 #${draft.commissionId}`,
      targetPath: `/commissions/${draft.commissionId}`,
      latestAt: draft.latestAt,
      lastPreview: draft.lastPreview,
      lastKind: draft.lastKind,
      priority: draft.priority,
      messageCount: draft.messages.length,
      notificationCount: draft.notifications.length,
      unreadCount: draft.unreadNotificationIds.length,
      unreadNotificationIds: draft.unreadNotificationIds,
      participantNames: [...draft.participantNames].slice(0, 3),
    }))
    .sort(newestFirst);
}
