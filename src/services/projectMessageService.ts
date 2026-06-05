import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { UserRole } from "@/types/user";

const PROJECT_MESSAGES_KEY = "visionai.projectMessages";
const PROJECT_MESSAGE_FILES_BUCKET = "project-message-files";

export interface ProjectMessageAttachment {
  fileName: string;
  fileUrl?: string;
  mimeType?: string;
  size?: number;
}

export interface ProjectMessage {
  id: string;
  commissionId: number;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  body: string;
  attachment?: ProjectMessageAttachment;
  createdAt: string;
}

export interface SendProjectMessageInput {
  commissionId: number;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  recipientRole: UserRole;
  body: string;
  file?: File | null;
}

type DbRow = Record<string, unknown>;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readMessages() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(PROJECT_MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as ProjectMessage[]) : [];
  } catch {
    return [];
  }
}

function writeMessages(messages: ProjectMessage[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PROJECT_MESSAGES_KEY, JSON.stringify(messages));
}

function createId(prefix = "project-message") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localAttachmentFromFile(file?: File | null): ProjectMessageAttachment | undefined {
  if (!file) return undefined;
  return {
    fileName: file.name,
    fileUrl: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(file) : undefined,
    mimeType: file.type || undefined,
    size: file.size,
  };
}

async function remoteAttachmentFromFile(commissionId: number, file?: File | null): Promise<ProjectMessageAttachment | undefined> {
  if (!file) return undefined;
  const safeName = file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, "_");
  const path = `${commissionId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(PROJECT_MESSAGE_FILES_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PROJECT_MESSAGE_FILES_BUCKET).getPublicUrl(path);
  return {
    fileName: file.name,
    fileUrl: data.publicUrl,
    mimeType: file.type || undefined,
    size: file.size,
  };
}

function sortMessages(messages: ProjectMessage[]) {
  return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

async function withFallback<T>(remote: () => Promise<T>, local: () => T | Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return local();
  try {
    return await remote();
  } catch (error) {
    console.warn("Supabase unavailable, using local project messages.", error);
    return local();
  }
}

function mapMessage(row: DbRow): ProjectMessage {
  const fileName = row.attachment_file_name as string | null | undefined;
  const attachment = fileName
    ? {
        fileName,
        fileUrl: row.attachment_file_url as string | undefined,
        mimeType: row.attachment_mime_type as string | undefined,
        size: row.attachment_size === null || row.attachment_size === undefined ? undefined : Number(row.attachment_size),
      }
    : undefined;

  return {
    id: row.id as string,
    commissionId: Number(row.commission_id),
    senderId: row.sender_id as string,
    senderName: row.sender_name as string,
    senderRole: row.sender_role as UserRole,
    recipientId: row.recipient_id as string,
    recipientName: row.recipient_name as string,
    recipientRole: row.recipient_role as UserRole,
    body: (row.body as string) || "",
    attachment,
    createdAt: row.created_at as string,
  };
}

function messageToRow(message: ProjectMessage) {
  return {
    id: message.id,
    commission_id: message.commissionId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    recipient_id: message.recipientId,
    recipient_name: message.recipientName,
    recipient_role: message.recipientRole,
    body: message.body,
    attachment_file_name: message.attachment?.fileName ?? null,
    attachment_file_url: message.attachment?.fileUrl ?? null,
    attachment_mime_type: message.attachment?.mimeType ?? null,
    attachment_size: message.attachment?.size ?? null,
    created_at: message.createdAt,
  };
}

function saveMessageLocally(message: ProjectMessage) {
  writeMessages([message, ...readMessages().filter((item) => item.id !== message.id)]);
}

export async function getProjectMessagesByCommission(commissionId: number): Promise<ProjectMessage[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("project_messages")
      .select("*")
      .eq("commission_id", commissionId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapMessage);
    return rows.length ? rows : sortMessages(readMessages().filter((message) => message.commissionId === commissionId));
  }, () => (
    sortMessages(readMessages().filter((message) => message.commissionId === commissionId))
  ));
}

export async function getProjectMessagesForUser(userId: string): Promise<ProjectMessage[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from("project_messages")
      .select("*")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapMessage);
    return rows.length ? rows : listProjectMessagesForUser(userId);
  }, () => listProjectMessagesForUser(userId));
}

function buildLocalMessage(input: SendProjectMessageInput, body: string): ProjectMessage {
  return {
    id: createId(),
    commissionId: input.commissionId,
    senderId: input.senderId,
    senderName: input.senderName,
    senderRole: input.senderRole,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    recipientRole: input.recipientRole,
    body,
    attachment: localAttachmentFromFile(input.file),
    createdAt: new Date().toISOString(),
  };
}

async function buildRemoteMessage(input: SendProjectMessageInput, body: string): Promise<ProjectMessage> {
  return {
    ...buildLocalMessage(input, body),
    attachment: await remoteAttachmentFromFile(input.commissionId, input.file),
  };
}

export async function sendProjectMessage(input: SendProjectMessageInput): Promise<ProjectMessage> {
  const body = input.body.trim();
  if (!body && !input.file) {
    throw new Error("请填写消息内容或上传附件");
  }

  return withFallback(async () => {
    const message = await buildRemoteMessage(input, body);
    const { data, error } = await supabase
      .from("project_messages")
      .insert(messageToRow(message))
      .select()
      .single();
    if (error) throw new Error(error.message);

    const saved = mapMessage(data);
    saveMessageLocally(saved);
    return saved;
  }, () => {
    const message = buildLocalMessage(input, body);
    saveMessageLocally(message);
    return message;
  });
}

export function getProjectMessagesByCommissionSync(commissionId: number): ProjectMessage[] {
  return readMessages()
    .filter((message) => message.commissionId === commissionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function listProjectMessagesForUser(userId: string): ProjectMessage[] {
  return sortMessages(readMessages().filter((message) => (
    message.senderId === userId || message.recipientId === userId
  )));
}
