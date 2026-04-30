export type NotificationType = "showcase-intent" | "event-registration" | "project-update";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  targetPath?: string;
}

export interface ShowcaseIntent {
  id: string;
  serviceId: string;
  serviceTitle: string;
  author: string;
  price: number;
  requirement: string;
  contact: string;
  status: "pending" | "confirmed";
  createdAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  contact: string;
  workTitle?: string;
  status: "registered";
  createdAt: string;
}

export interface ProjectNotificationParams {
  title: string;
  description: string;
  targetPath: string;
}

const INTENTS_KEY = "visionai.showcaseIntents";
const REGISTRATIONS_KEY = "visionai.eventRegistrations";
const NOTIFICATIONS_KEY = "visionai.notifications";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readList<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNotification(notification: Omit<NotificationItem, "id" | "createdAt" | "read">) {
  const item: NotificationItem = {
    ...notification,
    id: createId("notice"),
    createdAt: new Date().toISOString(),
    read: false,
  };
  writeList(NOTIFICATIONS_KEY, [item, ...readList<NotificationItem>(NOTIFICATIONS_KEY)]);
  return item;
}

export function createShowcaseIntent(params: {
  serviceId: string;
  serviceTitle: string;
  author: string;
  price: number;
  requirement: string;
  contact: string;
}) {
  if (!params.requirement.trim()) {
    throw new Error("请填写需求摘要");
  }
  if (!params.contact.trim()) {
    throw new Error("请填写联系方式");
  }

  const intent: ShowcaseIntent = {
    id: createId("intent"),
    serviceId: params.serviceId,
    serviceTitle: params.serviceTitle,
    author: params.author,
    price: params.price,
    requirement: params.requirement.trim(),
    contact: params.contact.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  writeList(INTENTS_KEY, [intent, ...readList<ShowcaseIntent>(INTENTS_KEY)]);
  createNotification({
    type: "showcase-intent",
    title: "橱窗沟通意向已提交",
    description: `${params.serviceTitle} 已进入需求确认，创作者会根据摘要回复报价。`,
    targetPath: "/messages",
  });
  return intent;
}

export function createEventRegistration(params: {
  eventId: string;
  eventTitle: string;
  participantName: string;
  contact: string;
  workTitle?: string;
}) {
  if (!params.participantName.trim()) {
    throw new Error("请填写报名人姓名");
  }
  if (!params.contact.trim()) {
    throw new Error("请填写联系方式");
  }

  const registration: EventRegistration = {
    id: createId("event"),
    eventId: params.eventId,
    eventTitle: params.eventTitle,
    participantName: params.participantName.trim(),
    contact: params.contact.trim(),
    workTitle: params.workTitle?.trim() || undefined,
    status: "registered",
    createdAt: new Date().toISOString(),
  };

  writeList(REGISTRATIONS_KEY, [registration, ...readList<EventRegistration>(REGISTRATIONS_KEY)]);
  createNotification({
    type: "event-registration",
    title: "活动报名已提交",
    description: `${params.eventTitle} 的报名信息已保存，后续节点会同步到消息中心。`,
    targetPath: "/events",
  });
  return registration;
}

export function createProjectNotification(params: ProjectNotificationParams) {
  return createNotification({
    type: "project-update",
    title: params.title,
    description: params.description,
    targetPath: params.targetPath,
  });
}

export function listShowcaseIntents() {
  return readList<ShowcaseIntent>(INTENTS_KEY);
}

export function listEventRegistrations() {
  return readList<EventRegistration>(REGISTRATIONS_KEY);
}

export function listNotifications() {
  return readList<NotificationItem>(NOTIFICATIONS_KEY);
}

export function markNotificationRead(id: string) {
  const notifications = readList<NotificationItem>(NOTIFICATIONS_KEY).map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
  writeList(NOTIFICATIONS_KEY, notifications);
  return notifications.find((item) => item.id === id) ?? null;
}
