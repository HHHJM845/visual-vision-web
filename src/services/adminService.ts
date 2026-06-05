import { demoCommissions, demoUsers, eventItems, showcaseItems } from "@/data/mockData";
import { requestDisputeDeliveryRevision } from "@/services/commissionService";
import { createProjectNotification } from "@/services/engagementService";
import {
  partiallyReleaseEscrowMilestone,
  refundEscrowMilestone,
  resumeFrozenEscrowMilestone,
} from "@/services/escrowService";
import { Commission, DisputeResolutionAction as ProjectDisputeResolutionAction, ProjectDispute } from "@/types/commission";
import { User, VerificationStatus } from "@/types/user";

export type ReviewType = "verification" | "project" | "portfolio" | "showcase" | "event" | "dispute";
export type ReviewStatus = "pending" | "verified" | "rejected" | "needs_changes";
export type DisputeResolutionAction = ProjectDisputeResolutionAction;

export interface DisputeResolutionInput {
  action: DisputeResolutionAction;
  note: string;
  releaseAmount?: number;
}

export interface ReviewItem {
  id: string;
  type: ReviewType;
  title: string;
  applicant: string;
  applicantRole: string;
  status: ReviewStatus;
  submittedAt: string;
  summary: string;
  targetId: string;
  fields: Array<{ label: string; value: string }>;
  portfolio?: Array<{ id: string; title: string; description: string; imageUrl: string }>;
}

export interface AuditLogItem {
  id: string;
  reviewId: string;
  reviewTitle: string;
  type: ReviewType;
  action: ReviewStatus;
  operatorId: string;
  operatorName: string;
  note: string;
  createdAt: string;
}

const USERS_KEY = "visionai.users";
const COMMISSIONS_KEY = "visionai.commissions";
const REVIEW_STATUS_KEY = "visionai.admin.reviewStatus";
const AUDIT_LOG_KEY = "visionai.admin.auditLog";
const CURRENT_USER_KEY = "visionai.currentUser";
const PROJECT_DISPUTES_KEY = "visionai.projectDisputes";

const adminUser: User = {
  id: "admin-hhhjm",
  email: "HHHJM",
  phone: "",
  nickname: "HHHJM",
  role: "admin",
  adminRole: "super_admin",
  verificationStatus: "verified",
  createdAt: "2026-05-14T00:00:00.000Z",
};

const typeLabels: Record<ReviewType, string> = {
  verification: "资质审核",
  project: "项目发布审核",
  portfolio: "作品集内容审核",
  showcase: "橱窗服务审核",
  event: "活动报名审核",
  dispute: "投诉/纠纷处理",
};

const disputeResolutionLabels: Record<DisputeResolutionAction, string> = {
  resume: "恢复托管，继续验收",
  reject_resume: "驳回纠纷并恢复托管",
  refund: "全额退款当前节点",
  partial_release: "部分释放，剩余退款",
  request_changes: "要求补交付，继续冻结",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readList<T>(key: string, fallback: T[]): T[] {
  if (!canUseStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
}

function writeList<T>(key: string, value: T[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readMap(): Record<string, ReviewStatus> {
  if (!canUseStorage()) return {};
  const raw = window.localStorage.getItem(REVIEW_STATUS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, ReviewStatus>;
  } catch {
    return {};
  }
}

function writeMap(value: Record<string, ReviewStatus>) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(REVIEW_STATUS_KEY, JSON.stringify(value));
}

function readUsers() {
  const users = readList<User>(USERS_KEY, [adminUser, ...demoUsers]);
  return users.some((user) => user.id === adminUser.id) ? users : [adminUser, ...users];
}

function readCommissions() {
  return readList<Commission>(COMMISSIONS_KEY, demoCommissions);
}

function readDisputes() {
  return readList<ProjectDispute>(PROJECT_DISPUTES_KEY, []);
}

function statusFor(id: string, fallback: ReviewStatus = "pending") {
  return readMap()[id] ?? fallback;
}

function buildVerificationReview(user: User): ReviewItem {
  const typeText = user.role === "client"
    ? user.clientVerificationType === "enterprise" ? "需求方企业认证" : "需求方实名认证"
    : "创作者资质认证";
  return {
    id: `verification-${user.id}`,
    type: "verification",
    title: `${typeText} - ${user.nickname}`,
    applicant: user.nickname,
    applicantRole: user.role === "client" ? "需求方" : "AIGCer",
    status: statusFor(`verification-${user.id}`, user.verificationStatus === "verified" ? "verified" : user.verificationStatus === "rejected" ? "rejected" : user.verificationStatus === "needs_changes" ? "needs_changes" : "pending"),
    submittedAt: user.createdAt,
    summary: user.role === "client" ? "审核实名/企业信息，通过后可发布项目并管理应征。" : "审核简介、能力标签与作品集，通过后可应征并进入 AI 匹配。",
    targetId: user.id,
    fields: [
      { label: "用户ID", value: user.id },
      { label: "账号", value: user.email },
      { label: "手机号", value: user.phone || "未填写" },
      { label: "认证类型", value: typeText },
      { label: "当前状态", value: user.verificationStatus },
      ...(user.aigcerProfile ? [
        { label: "简介", value: user.aigcerProfile.bio },
        { label: "擅长风格", value: user.aigcerProfile.styles.join("、") || "未填写" },
        { label: "常用工具", value: user.aigcerProfile.tools.join("、") || "未填写" },
      ] : []),
    ],
    portfolio: user.aigcerProfile?.portfolio,
  };
}

function buildProjectReview(item: Commission): ReviewItem {
  return {
    id: `project-${item.id}`,
    type: "project",
    title: item.title,
    applicant: item.authorNickname,
    applicantRole: "需求方",
    status: statusFor(
      `project-${item.id}`,
      item.status === "open" ? "verified" : item.status === "closed" ? "rejected" : "pending",
    ),
    submittedAt: item.deadline,
    summary: "审核项目需求描述、预算、交付周期和用途，避免无效/违规/风险需求进入广场。",
    targetId: String(item.id),
    fields: [
      { label: "项目ID", value: String(item.id) },
      { label: "发布方", value: item.authorNickname },
      { label: "用途", value: item.purpose },
      { label: "类别", value: item.category },
      { label: "预算", value: item.priceRange },
      { label: "截止日期", value: item.deadline },
      { label: "需求描述", value: item.description },
    ],
  };
}

function buildShowcaseReview(item: typeof showcaseItems[number]): ReviewItem {
  return {
    id: `showcase-${item.id}`,
    type: "showcase",
    title: item.title,
    applicant: item.author,
    applicantRole: "橱窗服务方",
    status: statusFor(`showcase-${item.id}`, "pending"),
    submittedAt: "2026-05-14T00:00:00.000Z",
    summary: "审核标准化服务标题、价格、交付承诺和售后说明，确认后进入橱窗展示。",
    targetId: item.id,
    fields: [
      { label: "服务ID", value: item.id },
      { label: "服务方", value: item.author },
      { label: "类别", value: item.category },
      { label: "起价", value: `¥${item.price}` },
      { label: "交付", value: item.delivery },
      { label: "标签", value: item.tag || "无" },
    ],
  };
}

function buildEventReview(item: typeof eventItems[number]): ReviewItem {
  return {
    id: `event-${item.id}`,
    type: "event",
    title: item.title,
    applicant: "活动运营",
    applicantRole: "活动发起方",
    status: statusFor(`event-${item.id}`, item.status === "报名中" ? "pending" : "verified"),
    submittedAt: item.date,
    summary: "审核活动规则、报名状态、作品提交要求和展示入口，确认后对用户开放报名。",
    targetId: item.id,
    fields: [
      { label: "活动ID", value: item.id },
      { label: "状态", value: item.status },
      { label: "时间", value: item.date },
      { label: "活动说明", value: item.description },
    ],
  };
}

function buildPortfolioReviews(users: User[]): ReviewItem[] {
  return users
    .filter((user) => user.role === "aigcer" && user.aigcerProfile?.portfolio?.length)
    .map((user) => ({
      ...buildVerificationReview(user),
      id: `portfolio-${user.id}`,
      type: "portfolio" as const,
      title: `作品集内容审核 - ${user.nickname}`,
      summary: "审核作品集标题、图片、描述和风格标签，确认可用于甲方筛选和 AI 匹配。",
      status: statusFor(`portfolio-${user.id}`, "pending"),
    }));
}

function buildDisputeReviews(): ReviewItem[] {
  const submittedDisputes = readDisputes().map((item) => ({
    id: `dispute-${item.id}`,
    type: "dispute" as const,
    title: `投诉/纠纷 - ${item.commissionTitle}`,
    applicant: item.reporterName,
    applicantRole: "交易相关方",
    status: statusFor(`dispute-${item.id}`, item.status === "resolved" ? "verified" : item.status === "rejected" ? "rejected" : "pending"),
    submittedAt: item.createdAt,
    summary: item.reason,
    targetId: item.id,
    fields: [
      { label: "项目", value: item.commissionTitle },
      { label: "当前节点", value: item.stageLabel || "未关联节点" },
      { label: "提交人", value: item.reporterName },
      { label: "关联创作者", value: item.applicantName || "未关联" },
      { label: "问题说明", value: item.reason },
      { label: "处理诉求", value: item.expectation },
    ],
  }));

  return [
    ...submittedDisputes,
    {
      id: "dispute-demo-1",
      type: "dispute",
      title: "粗剪阶段交付范围争议",
      applicant: "柚柚酒 / 星河影像",
      applicantRole: "交易双方",
      status: statusFor("dispute-demo-1", "pending"),
      submittedAt: "2026-05-14T08:00:00.000Z",
      summary: "需求方认为粗剪缺少产品镜头，创作者认为不在首版范围内，需要平台介入确认节点边界。",
      targetId: "demo-dispute",
      fields: [
        { label: "项目", value: "企业品牌AI宣传片制作" },
        { label: "当前节点", value: "粗剪" },
        { label: "需求方诉求", value: "补充 3 个产品展示镜头" },
        { label: "创作者说明", value: "初始需求未包含该镜头，需确认是否增补费用" },
      ],
    },
  ];
}

export function getReviewTypeLabel(type: ReviewType) {
  return typeLabels[type];
}

export function getDisputeResolutionLabel(action: DisputeResolutionAction) {
  return disputeResolutionLabels[action];
}

export function listReviewItems(type?: ReviewType, status?: ReviewStatus | "all") {
  const users = readUsers().filter((user) => user.role !== "admin");
  const items = [
    ...users.map(buildVerificationReview),
    ...readCommissions().map(buildProjectReview),
    ...buildPortfolioReviews(users),
    ...showcaseItems.map(buildShowcaseReview),
    ...eventItems.map(buildEventReview),
    ...buildDisputeReviews(),
  ];
  return items
    .filter((item) => !type || item.type === type)
    .filter((item) => !status || status === "all" || item.status === status);
}

export function getReviewItem(id: string) {
  return listReviewItems().find((item) => item.id === id) ?? null;
}

export function listAuditLogs() {
  return readList<AuditLogItem>(AUDIT_LOG_KEY, []);
}

export function listAdminUsers() {
  return readUsers();
}

export function updateReviewStatus(id: string, action: ReviewStatus, note: string, operator: User) {
  const item = getReviewItem(id);
  if (!item) throw new Error("审核项不存在");
  if ((action === "rejected" || action === "needs_changes") && !note.trim()) {
    throw new Error("驳回或要求补充材料时必须填写原因");
  }

  const statusMap = readMap();
  statusMap[id] = action;
  writeMap(statusMap);

  if (item.type === "verification") {
    const users = readUsers().map((user) => {
      if (user.id !== item.targetId) return user;
      return { ...user, verificationStatus: action as VerificationStatus };
    });
    writeList(USERS_KEY, users);
    const currentRaw = canUseStorage() ? window.localStorage.getItem(CURRENT_USER_KEY) : null;
    if (currentRaw) {
      try {
        const current = JSON.parse(currentRaw) as User;
        const updated = users.find((user) => user.id === current.id);
        if (updated) window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
      } catch {
        // Ignore broken user cache.
      }
    }
  }

  if (item.type === "project") {
    const commissions = readCommissions().map((commission) => {
      if (String(commission.id) !== item.targetId) return commission;
      return {
        ...commission,
        status: action === "verified" ? "open" as const : action === "rejected" ? "closed" as const : "pending_review" as const,
      };
    });
    writeList(COMMISSIONS_KEY, commissions);
  }

  if (item.type === "dispute") {
    const disputes = readDisputes().map((dispute) => {
      if (dispute.id !== item.targetId) return dispute;
      return {
        ...dispute,
        status: action === "verified" ? "resolved" as const : action === "rejected" ? "rejected" as const : "processing" as const,
        updatedAt: new Date().toISOString(),
      };
    });
    writeList(PROJECT_DISPUTES_KEY, disputes);
  }

  const log: AuditLogItem = {
    id: `audit-${Date.now()}`,
    reviewId: id,
    reviewTitle: item.title,
    type: item.type,
    action,
    operatorId: operator.id,
    operatorName: operator.nickname,
    note: note.trim() || "审核通过",
    createdAt: new Date().toISOString(),
  };
  writeList(AUDIT_LOG_KEY, [log, ...listAuditLogs()]);
  return { ...item, status: action };
}

function writeReviewStatus(id: string, action: ReviewStatus) {
  const statusMap = readMap();
  statusMap[id] = action;
  writeMap(statusMap);
}

function updateDisputeState(
  disputeId: string,
  status: ProjectDispute['status'],
  resolution?: {
    action: DisputeResolutionAction;
    note: string;
    operator: User;
  },
) {
  const now = new Date().toISOString();
  const disputes = readDisputes().map((dispute) => (
    dispute.id === disputeId
      ? {
          ...dispute,
          status,
          resolutionAction: resolution?.action ?? dispute.resolutionAction,
          resolutionNote: resolution?.note ?? dispute.resolutionNote,
          resolvedById: resolution?.operator.id ?? dispute.resolvedById,
          resolvedByName: resolution?.operator.nickname ?? dispute.resolvedByName,
          resolvedAt: resolution ? now : dispute.resolvedAt,
          updatedAt: now,
        }
      : dispute
  ));
  writeList(PROJECT_DISPUTES_KEY, disputes);
}

function createAuditLog(item: ReviewItem, action: ReviewStatus, note: string, operator: User) {
  const log: AuditLogItem = {
    id: `audit-${Date.now()}`,
    reviewId: item.id,
    reviewTitle: item.title,
    type: item.type,
    action,
    operatorId: operator.id,
    operatorName: operator.nickname,
    note,
    createdAt: new Date().toISOString(),
  };
  writeList(AUDIT_LOG_KEY, [log, ...listAuditLogs()]);
  return log;
}

function notifyDisputeResolution(commission: Commission, dispute: ProjectDispute, title: string, description: string) {
  createProjectNotification({
    title,
    description,
    targetPath: `/commissions/${commission.id}`,
    recipientId: commission.authorId,
    recipientRole: "client",
    actionLabel: "查看项目",
    priority: "high",
  });

  if (dispute.applicantId) {
    createProjectNotification({
      title,
      description,
      targetPath: `/commissions/${commission.id}`,
      recipientId: dispute.applicantId,
      recipientRole: "aigcer",
      actionLabel: "查看项目",
      priority: "high",
    });
  }
}

export async function resolveDisputeReview(
  id: string,
  resolution: DisputeResolutionInput,
  operator: User,
) {
  const item = getReviewItem(id);
  if (!item) throw new Error("审核项不存在");
  if (item.type !== "dispute") throw new Error("该审核项不是纠纷处理");
  if (!resolution.note.trim()) throw new Error("处理纠纷必须填写裁决说明");

  const dispute = readDisputes().find((entry) => entry.id === item.targetId);
  if (!dispute) throw new Error("纠纷记录不存在");
  if (!dispute.stageId) throw new Error("纠纷未关联交付节点");

  const commission = readCommissions().find((entry) => entry.id === dispute.commissionId);
  if (!commission) throw new Error("项目不存在");

  const note = `${getDisputeResolutionLabel(resolution.action)}：${resolution.note.trim()}`;
  let reviewStatus: ReviewStatus = "verified";
  let disputeStatus: ProjectDispute['status'] = "resolved";

  if (resolution.action === "resume" || resolution.action === "reject_resume") {
    await resumeFrozenEscrowMilestone({
      commissionId: dispute.commissionId,
      stageId: dispute.stageId,
      frozenById: operator.id,
    });
    reviewStatus = resolution.action === "reject_resume" ? "rejected" : "verified";
    disputeStatus = resolution.action === "reject_resume" ? "rejected" : "resolved";
  } else if (resolution.action === "refund") {
    await refundEscrowMilestone({
      commissionId: dispute.commissionId,
      stageId: dispute.stageId,
      refundedById: operator.id,
      refundToId: commission.authorId,
      note,
    });
  } else if (resolution.action === "partial_release") {
    if (!dispute.applicantId) throw new Error("纠纷未关联创作者，无法部分释放");
    const releaseAmount = Number(resolution.releaseAmount);
    await partiallyReleaseEscrowMilestone({
      commissionId: dispute.commissionId,
      stageId: dispute.stageId,
      releasedById: operator.id,
      releasedToId: dispute.applicantId,
      refundToId: commission.authorId,
      releaseAmount,
      note,
    });
  } else if (resolution.action === "request_changes") {
    await requestDisputeDeliveryRevision(dispute.commissionId, {
      stageId: dispute.stageId,
      deliveryId: dispute.deliveryId,
      requestedById: operator.id,
      feedback: note,
    });
    reviewStatus = "needs_changes";
    disputeStatus = "processing";
  }

  writeReviewStatus(item.id, reviewStatus);
  updateDisputeState(dispute.id, disputeStatus, {
    action: resolution.action,
    note,
    operator,
  });
  createAuditLog(item, reviewStatus, note, operator);
  notifyDisputeResolution(
    commission,
    dispute,
    resolution.action === "request_changes" ? "纠纷裁决：需要补交付" : "纠纷裁决已更新",
    `「${commission.title}」的纠纷处理结果：${note}`,
  );
  return { ...item, status: reviewStatus };
}
