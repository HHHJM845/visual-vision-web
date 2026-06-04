import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, BrainCircuit, CheckCircle, ChevronLeft, FileText, Gauge, Loader2, MessageCircle, Pencil, ShieldAlert, Share2, Sparkles, Star, Trash2, UploadCloud, UserRound, WandSparkles, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { EmptyState, ErrorState, PageLoading } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyToCommission,
  closeCommission,
  confirmProjectStage,
  confirmProjectStageDelivery,
  createProjectDispute,
  deleteCommission,
  getApplicantsWithProfiles,
  getCommissionById,
  getProjectDeliveries,
  getProjectDisputes,
  getProjectProgress,
  projectStages,
  requestProjectStageChanges,
  submitProjectStage,
  submitProjectStageDelivery,
  updateApplicationDraft,
  updateApplicationStatus,
  withdrawApplication,
} from "@/services/commissionService";
import { createProjectNotification } from "@/services/engagementService";
import {
  createEscrowDraft,
  fundEscrowPlan,
  getEscrowBundleByCommission,
  releaseEscrowMilestone,
  updateEscrowMilestones,
} from "@/services/escrowService";
import {
  createContractDraft,
  getContractByCommission,
  signContract,
} from "@/services/contractService";
import { useSmartMatch } from "@/hooks/useSmartMatch";

export default function CommissionDetail() {
  const { id } = useParams();
  const commissionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'smart'>('all');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);
  const [applicationActionId, setApplicationActionId] = useState<string | null>(null);
  const [projectAction, setProjectAction] = useState<null | 'close' | 'delete'>(null);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [editApplicationMessage, setEditApplicationMessage] = useState("");
  const [editApplicationPrice, setEditApplicationPrice] = useState("");
  const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [deliveryTitle, setDeliveryTitle] = useState("");
  const [deliveryDescription, setDeliveryDescription] = useState("");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeExpectation, setDisputeExpectation] = useState("");
  const [stageActionBusy, setStageActionBusy] = useState(false);
  const [escrowBusy, setEscrowBusy] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);
  const [escrowAmountInput, setEscrowAmountInput] = useState("");
  const [escrowPercentInputs, setEscrowPercentInputs] = useState<Record<string, string>>({});
  const [, setProgressTick] = useState(0);
  const { isLoading: matchLoading, scores, error: matchError, runMatch } = useSmartMatch();

  const { data: commission, isLoading, isError, refetch } = useQuery({
    queryKey: ['commission', commissionId],
    queryFn: () => getCommissionById(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const { data: applicants = [], refetch: refetchApplicants } = useQuery({
    queryKey: ['commission-applicants', commissionId],
    queryFn: () => getApplicantsWithProfiles(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const { data: deliveries = [], refetch: refetchDeliveries } = useQuery({
    queryKey: ['project-deliveries', commissionId],
    queryFn: () => getProjectDeliveries(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const { data: disputes = [], refetch: refetchDisputes } = useQuery({
    queryKey: ['project-disputes', commissionId],
    queryFn: () => getProjectDisputes(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const hasApplied = !!user && applicants.some((applicant) => applicant.aigcerId === user.id);

  const sortedApplicants = useMemo(() => {
    if (activeTab !== 'smart' || !scores) return applicants;
    return [...applicants].sort((a, b) => {
      const sa = scores.find((score) => score.id === a.aigcerId)?.score ?? 0;
      const sb = scores.find((score) => score.id === b.aigcerId)?.score ?? 0;
      return sb - sa;
    });
  }, [activeTab, applicants, scores]);

  const daysLeft = commission
    ? Math.max(0, Math.ceil((new Date(commission.deadline).getTime() - Date.now()) / 86400000))
    : 0;
  const isExpired = commission ? new Date(commission.deadline).getTime() < Date.now() : false;
  const selectedApplicant = applicants.find((applicant) => applicant.id === selectedApplicantId) ?? null;
  const acceptedApplicant = applicants.find((applicant) => applicant.status === 'accepted') ?? null;

  const { data: escrowBundle = null, refetch: refetchEscrow } = useQuery({
    queryKey: ['escrow', commissionId],
    queryFn: () => getEscrowBundleByCommission(commissionId),
    enabled: Number.isFinite(commissionId) && !!acceptedApplicant,
  });

  const { data: projectContract = null, refetch: refetchContract } = useQuery({
    queryKey: ['contract', commissionId],
    queryFn: () => getContractByCommission(commissionId),
    enabled: Number.isFinite(commissionId) && !!acceptedApplicant,
  });

  const isProjectOwner = !!user && !!commission && user.id === commission.authorId;
  const isAcceptedAigcer = !!user && !!acceptedApplicant && user.id === acceptedApplicant.aigcerId;
  const isClosed = commission?.status === 'closed';
  const isPendingReview = commission?.status === 'pending_review';
  const canViewApplicantPanel = isProjectOwner || user?.role === 'admin';
  const progress = commission ? getProjectProgress(commission.id) : null;
  const currentStageIndex = progress ? projectStages.findIndex((stage) => stage.id === progress.currentStage) : 0;
  const currentStage = projectStages[Math.max(currentStageIndex, 0)];
  const nextStage = projectStages[Math.min(currentStageIndex + 1, projectStages.length - 1)];
  const progressCompleted = progress?.stageStatus === 'completed';
  const canSubmitStage = !!acceptedApplicant && !!commission && isAcceptedAigcer && progress?.stageStatus === 'waiting_aigcer';
  const canConfirmStage = !!acceptedApplicant && !!commission && isProjectOwner && progress?.stageStatus === 'waiting_owner';
  const canActOnStage = canSubmitStage || canConfirmStage;
  const currentDelivery = progress?.activeDeliveryId
    ? deliveries.find((item) => item.id === progress.activeDeliveryId) ?? null
    : deliveries.find((item) => item.stageId === progress?.currentStage && item.status === 'submitted') ?? null;
  const progressActionLabel = progressCompleted
    ? '流程已完成'
    : canSubmitStage
      ? currentStage.aigcerAction
      : canConfirmStage
        ? currentStage.ownerAction
        : progress?.stageStatus === 'waiting_owner'
          ? '等待甲方确认'
          : '等待乙方提交';
  const progressStatusText = progressCompleted
    ? '全部交付节点已确认完成。'
    : progress?.stageStatus === 'waiting_owner'
      ? '乙方已提交当前节点，等待甲方反馈或确认。'
      : '当前节点等待乙方提报交付内容。';

  function parseBudgetAmount(priceRange?: string) {
    const text = priceRange ?? "";
    const nums = text.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    if (!nums.length) return 0;
    const max = Math.max(...nums);
    return /k/i.test(text) ? max * 1000 : max;
  }

  function formatCurrency(amount: number) {
    return `¥${Math.round(amount).toLocaleString("zh-CN")}`;
  }

  const escrowPercentTotal = useMemo(() => {
    if (!escrowBundle) return 0;
    return Number(escrowBundle.milestones.reduce((sum, milestone) => (
      sum + Number(escrowPercentInputs[milestone.id] ?? milestone.percent)
    ), 0).toFixed(2));
  }, [escrowBundle, escrowPercentInputs]);

  const escrowReleasedAmount = escrowBundle?.plan.releasedAmount ?? 0;
  const escrowPendingAmount = escrowBundle ? Math.max(0, escrowBundle.plan.totalAmount - escrowReleasedAmount) : 0;
  const escrowReleaseProgress = escrowBundle?.plan.totalAmount
    ? Math.round((escrowReleasedAmount / escrowBundle.plan.totalAmount) * 100)
    : 0;
  const deliveryFormatText = commission?.format || `${commission?.category ?? '视觉内容'}交付文件`;
  const milestoneSummaryText = projectStages.map((stage) => stage.label).join("、");
  const escrowSummaryText = escrowBundle
    ? `${formatCurrency(escrowBundle.plan.totalAmount)} ${escrowBundle.plan.status === 'draft' ? '待确认托管' : escrowBundle.plan.status === 'funded' ? '已模拟托管' : '已全部释放'}`
    : "双方确认后可创建模拟托管计划";
  const contractStatusText = projectContract?.status === 'active'
    ? '已生效'
    : projectContract?.status === 'client_signed'
      ? '待乙方签署'
      : projectContract?.status === 'aigcer_signed'
        ? '待甲方签署'
        : '草稿';

  useEffect(() => {
    if (commission && !escrowBundle && !escrowAmountInput) {
      const amount = parseBudgetAmount(commission.priceRange);
      if (amount > 0) setEscrowAmountInput(String(amount));
    }
  }, [commission, escrowBundle, escrowAmountInput]);

  useEffect(() => {
    if (!escrowBundle) return;
    setEscrowAmountInput(String(escrowBundle.plan.totalAmount));
    setEscrowPercentInputs(Object.fromEntries(
      escrowBundle.milestones.map((milestone) => [milestone.id, String(milestone.percent)])
    ));
  }, [escrowBundle]);

  function getScore(aigcerId: string) {
    return scores?.find((item) => item.id === aigcerId)?.score ?? null;
  }

  function getMatchResult(aigcerId: string) {
    return scores?.find((item) => item.id === aigcerId) ?? null;
  }

  function getRecommendation(score: number | null) {
    if (score === null) return { label: "待分析", className: "bg-muted text-muted-foreground", summary: "切换到智能推荐后会生成匹配评分。" };
    if (score >= 85) return { label: "优先沟通", className: "bg-primary text-primary-foreground", summary: "风格与需求高度契合，建议优先约定样片或节点计划。" };
    if (score >= 70) return { label: "值得沟通", className: "bg-secondary text-secondary-foreground", summary: "能力方向较匹配，可进一步确认档期、预算与交付方式。" };
    return { label: "谨慎评估", className: "bg-muted text-muted-foreground", summary: "匹配度一般，建议重点核对相关案例和执行经验。" };
  }

  function getMatchReasons(applicant: typeof applicants[number]) {
    const match = getMatchResult(applicant.aigcerId);
    if (match?.reasons?.length) return match.reasons;
    const text = `${commission?.description ?? ""} ${commission?.category ?? ""}`;
    const styleHits = applicant.styles.filter((style) => text.includes(style));
    const toolText = applicant.tools.length ? applicant.tools.join("、") : "暂未填写工具";
    return [
      styleHits.length ? `风格命中：${styleHits.join("、")}` : `风格资料：${applicant.styles.slice(0, 3).join("、") || "暂未填写"}`,
      `工具链：${toolText}`,
      applicant.bio ? `简介线索：${applicant.bio}` : "简介资料较少，建议沟通时补充案例。",
    ];
  }

  function getMatchedPortfolio(applicant: typeof applicants[number]) {
    const match = getMatchResult(applicant.aigcerId);
    const ids = match?.matchedPortfolioIds ?? [];
    return applicant.portfolio.filter((item) => ids.includes(item.id));
  }

  async function handleApply() {
    if (!user || !commission) return;
    setApplying(true);
    try {
      await applyToCommission(commission.id, user.id, user.nickname, applyMessage.trim(), expectedPrice.trim());
      toast({ title: "应征成功", description: "需求方会在项目工作台查看你的应征信息。" });
      createProjectNotification({
        title: "项目应征已提交",
        description: `你已应征「${commission.title}」，后续筛选结果会同步到项目详情和工作台。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: commission.authorId,
        recipientRole: "client",
        actionLabel: "查看应征",
        priority: "normal",
      });
      setApplyOpen(false);
      setApplyMessage("");
      setExpectedPrice("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commissions'] }),
        queryClient.invalidateQueries({ queryKey: ['commission', commission.id] }),
        refetch(),
        refetchApplicants(),
      ]);
    } catch (e: unknown) {
      toast({ title: "应征失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  }

  async function handleApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
    if (!commission) return;
    setApplicationActionId(applicationId);
    try {
      await updateApplicationStatus(commission.id, applicationId, status);
      toast({
        title: status === 'accepted' ? '已选定创作者' : '已拒绝应征',
        description: status === 'accepted' ? '项目已进入合作中，双方工作台会同步状态。' : '该应征已从候选列表中移出。',
      });
      const applicant = applicants.find((item) => item.id === applicationId);
      createProjectNotification({
        title: status === 'accepted' ? "合作已选定" : "应征状态已更新",
        description: status === 'accepted'
          ? `「${commission.title}」已选定 ${applicant?.aigcerNickname ?? "创作者"}，可以开始推进交付节点。`
          : `「${commission.title}」的一条应征已被拒绝。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: applicant?.aigcerId,
        recipientRole: "aigcer",
        actionLabel: status === 'accepted' ? "进入项目" : "查看结果",
        priority: status === 'accepted' ? "high" : "normal",
      });
      setSelectedApplicantId(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['commission-applicants', commission.id] }),
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['commissions'] }),
      refetchApplicants(),
    ]);
    } catch (e: unknown) {
      toast({
        title: '操作失败',
        description: e instanceof Error ? e.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setApplicationActionId(null);
    }
  }

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    toast({ title: "链接已复制", description: "可以发送给协作成员继续评估。" });
  }

  function openApplicationEdit(applicationId: string) {
    const application = applicants.find((item) => item.id === applicationId);
    if (!application) return;
    setEditingApplicationId(applicationId);
    setEditApplicationMessage(application.message);
    setEditApplicationPrice(application.expectedPrice);
  }

  async function handleSaveApplicationEdit() {
    if (!editingApplicationId || !commission) return;
    setApplicationActionId(editingApplicationId);
    try {
      await updateApplicationDraft(editingApplicationId, {
        message: editApplicationMessage.trim(),
        expectedPrice: editApplicationPrice.trim(),
      });
      toast({ title: '应征信息已更新', description: '需求方会看到最新报价和说明。' });
      setEditingApplicationId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commission-applicants', commission.id] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        refetchApplicants(),
      ]);
    } catch (e: unknown) {
      toast({ title: '保存失败', description: e instanceof Error ? e.message : '请稍后重试', variant: 'destructive' });
    } finally {
      setApplicationActionId(null);
    }
  }

  async function handleWithdrawApplication() {
    if (!withdrawTargetId || !commission) return;
    setApplicationActionId(withdrawTargetId);
    try {
      await withdrawApplication(withdrawTargetId);
      toast({ title: '已撤回应征', description: '该项目将不再把你作为候选人展示。' });
      setWithdrawTargetId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['commission-applicants', commission.id] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        refetchApplicants(),
      ]);
    } catch (e: unknown) {
      toast({ title: '撤回失败', description: e instanceof Error ? e.message : '请稍后重试', variant: 'destructive' });
    } finally {
      setApplicationActionId(null);
    }
  }

  async function handleProjectAction() {
    if (!commission || !projectAction) return;
    try {
      if (projectAction === 'close') {
        await closeCommission(commission.id);
        toast({ title: '已关闭招募', description: '项目仍可查看，但新的创作者不能继续应征。' });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['commission', commission.id] }),
          queryClient.invalidateQueries({ queryKey: ['commissions'] }),
        ]);
        await refetch();
      } else {
        await deleteCommission(commission.id);
        toast({ title: '项目已删除', description: '项目和相关应征记录已移除。' });
        navigate('/dashboard/client', { replace: true });
      }
    } catch (e: unknown) {
      toast({ title: '操作失败', description: e instanceof Error ? e.message : '请稍后重试', variant: 'destructive' });
    } finally {
      setProjectAction(null);
    }
  }

  async function handleCreateEscrowDraft() {
    if (!commission || !user) return;
    const amount = Number(escrowAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "托管金额无效", description: "请输入大于 0 的托管金额。", variant: "destructive" });
      return;
    }

    setEscrowBusy(true);
    try {
      await createEscrowDraft({
        commissionId: commission.id,
        totalAmount: amount,
        createdById: user.id,
      });
      await refetchEscrow();
      toast({ title: "托管计划已创建", description: "请确认各节点付款比例，合计需等于 100%。" });
    } catch (e: unknown) {
      toast({ title: "创建托管计划失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setEscrowBusy(false);
    }
  }

  async function handleFundEscrowPlan() {
    if (!escrowBundle) return;
    if (escrowPercentTotal !== 100) {
      toast({ title: "付款比例不正确", description: "所有节点付款比例合计必须等于 100%。", variant: "destructive" });
      return;
    }

    setEscrowBusy(true);
    try {
      await updateEscrowMilestones(
        escrowBundle.plan.id,
        escrowBundle.milestones.map((milestone) => ({
          milestoneId: milestone.id,
          percent: Number(escrowPercentInputs[milestone.id] ?? milestone.percent),
        })),
      );
      await fundEscrowPlan(escrowBundle.plan.id);
      await refetchEscrow();
      toast({ title: "资金已进入模拟托管", description: "后续甲方确认节点后，系统会释放对应款项。" });
    } catch (e: unknown) {
      toast({ title: "确认托管失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setEscrowBusy(false);
    }
  }

  async function handleCreateContractDraft() {
    if (!commission || !acceptedApplicant || !user) return;

    setContractBusy(true);
    try {
      await createContractDraft({
        commissionId: commission.id,
        commissionTitle: commission.title,
        clientId: commission.authorId,
        clientName: commission.authorNickname,
        aigcerId: acceptedApplicant.aigcerId,
        aigcerName: acceptedApplicant.aigcerNickname,
        budgetText: commission.priceRange,
        deliveryFormat: deliveryFormatText,
        milestoneSummary: milestoneSummaryText,
        escrowSummary: escrowSummaryText,
      });
      await refetchContract();
      createProjectNotification({
        title: "合作合同待签署",
        description: `「${commission.title}」合同草稿已生成，请确认项目范围、交付节点和付款安排。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: acceptedApplicant.aigcerId,
        recipientRole: "aigcer",
        actionLabel: "签署合同",
        priority: "high",
      });
      toast({ title: "合同草稿已生成", description: "双方确认条款后可分别完成模拟签署。" });
    } catch (e: unknown) {
      toast({ title: "生成合同失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setContractBusy(false);
    }
  }

  async function handleSignContract(role: 'client' | 'aigcer') {
    if (!projectContract) return;

    setContractBusy(true);
    try {
      const signed = await signContract(projectContract.id, role);
      await refetchContract();
      if (role === 'client') {
        createProjectNotification({
          title: "合作合同待你签署",
          description: `「${projectContract.commissionTitle}」甲方已签署，请你确认合同。`,
          targetPath: `/commissions/${projectContract.commissionId}`,
          recipientId: projectContract.aigcerId,
          recipientRole: "aigcer",
          actionLabel: "签署合同",
          priority: "high",
        });
      } else if (signed.status === 'active') {
        createProjectNotification({
          title: "合作合同已生效",
          description: `「${projectContract.commissionTitle}」双方已完成签署，可以继续推进交付和托管。`,
          targetPath: `/commissions/${projectContract.commissionId}`,
          recipientId: projectContract.clientId,
          recipientRole: "client",
          actionLabel: "查看合同",
          priority: "normal",
        });
      }
      toast({ title: "签署已记录", description: role === 'client' ? "甲方签署时间已写入合同。" : "乙方签署时间已写入合同。" });
    } catch (e: unknown) {
      toast({ title: "签署失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setContractBusy(false);
    }
  }

  function handleStageAction() {
    if (!commission || !canActOnStage) return;
    const next = canSubmitStage ? submitProjectStage(commission.id) : confirmProjectStage(commission.id);
    const stage = projectStages.find((item) => item.id === next.currentStage);
    setProgressTick((value) => value + 1);
    const submitted = next.stageStatus === 'waiting_owner';
    const completed = next.stageStatus === 'completed';
    toast({
      title: submitted ? `${currentStage.label}已提交` : completed ? '全部节点已确认' : `已进入${stage?.label ?? '下一节点'}`,
      description: submitted ? '已通知甲方进行反馈或确认。' : '节点确认已同步，乙方可以继续提交下一项。',
    });
    createProjectNotification({
      title: submitted ? "交付节点待确认" : completed ? "项目全部节点已完成" : `项目进入${stage?.label ?? "下一节点"}`,
      description: submitted
        ? `「${commission.title}」的${currentStage.label}已提交，甲方可进入项目详情确认或反馈。`
        : `「${commission.title}」节点已确认，双方可继续推进后续交付。`,
      targetPath: `/commissions/${commission.id}`,
    });
  }

  async function handleStageActionV2() {
    if (!commission || !canActOnStage || !user) return;
    if (canSubmitStage) {
      setDeliveryTitle(currentStage.label);
      setDeliveryDescription("");
      setDeliveryFile(null);
      setDeliveryOpen(true);
      return;
    }
    setStageActionBusy(true);
    try {
      const releasingStage = currentStage;
      const next = await confirmProjectStageDelivery(commission.id, user.id);
      const stage = projectStages.find((item) => item.id === next.currentStage);
      setProgressTick((value) => value + 1);
      await refetchDeliveries();
      if (acceptedApplicant) {
        try {
          await releaseEscrowMilestone({
            commissionId: commission.id,
            stageId: releasingStage.id,
            releasedById: user.id,
            releasedToId: acceptedApplicant.aigcerId,
          });
          await refetchEscrow();
        } catch (escrowError: unknown) {
          toast({
            title: "托管款项未释放",
            description: escrowError instanceof Error ? escrowError.message : "交付已确认，但托管释放需要稍后重试。",
            variant: "destructive",
          });
        }
      }
      const completed = next.stageStatus === 'completed';
      toast({
        title: completed ? "全部节点已确认" : `已进入${stage?.label ?? "下一节点"}`,
        description: "节点确认已保存，双方可继续推进后续交付。",
      });
      createProjectNotification({
        title: completed ? "项目全部节点已完成" : `项目进入${stage?.label ?? "下一节点"}`,
        description: `「${commission.title}」节点已确认，双方可继续推进后续交付。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: acceptedApplicant?.aigcerId,
        recipientRole: "aigcer",
        actionLabel: completed ? "查看项目" : "提交下一节点",
        priority: "normal",
      });
    } catch (e: unknown) {
      toast({ title: "节点确认失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setStageActionBusy(false);
    }
  }

  async function handleSubmitDelivery() {
    if (!commission || !user || !canSubmitStage) return;
    setStageActionBusy(true);
    try {
      await submitProjectStageDelivery(commission.id, {
        title: deliveryTitle.trim(),
        description: deliveryDescription.trim(),
        file: deliveryFile,
        submittedById: user.id,
        submittedByName: user.nickname,
      });
      setDeliveryOpen(false);
      setDeliveryTitle("");
      setDeliveryDescription("");
      setDeliveryFile(null);
      setProgressTick((value) => value + 1);
      await refetchDeliveries();
      toast({ title: `${currentStage.label}已提交`, description: "交付物和版本记录已保存，等待甲方确认或反馈。" });
      createProjectNotification({
        title: "交付节点待确认",
        description: `「${commission.title}」的${currentStage.label}已提交，甲方可进入项目详情确认或反馈。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: commission.authorId,
        recipientRole: "client",
        actionLabel: "确认交付",
        priority: "high",
      });
    } catch (e: unknown) {
      toast({ title: "交付提交失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setStageActionBusy(false);
    }
  }

  async function handleRequestChanges() {
    if (!commission || !user || !canConfirmStage) return;
    setStageActionBusy(true);
    try {
      await requestProjectStageChanges(commission.id, {
        feedback: feedbackText.trim(),
        requestedById: user.id,
      });
      setFeedbackOpen(false);
      setFeedbackText("");
      setProgressTick((value) => value + 1);
      await refetchDeliveries();
      toast({ title: "修改意见已发送", description: "当前节点已回到乙方待提交状态，历史反馈会保留在交付记录中。" });
      createProjectNotification({
        title: "交付节点需要修改",
        description: `「${commission.title}」的${currentStage.label}已收到甲方反馈，请修改后重新提交。`,
        targetPath: `/commissions/${commission.id}`,
        recipientId: acceptedApplicant?.aigcerId,
        recipientRole: "aigcer",
        actionLabel: "修改交付",
        priority: "high",
      });
    } catch (e: unknown) {
      toast({ title: "反馈提交失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setStageActionBusy(false);
    }
  }

  async function handleCreateDispute() {
    if (!commission || !user) return;
    setStageActionBusy(true);
    try {
      await createProjectDispute({
        commissionId: commission.id,
        commissionTitle: commission.title,
        stageId: currentStage?.id,
        stageLabel: currentStage?.label,
        applicantId: acceptedApplicant?.aigcerId,
        applicantName: acceptedApplicant?.aigcerNickname,
        reporterId: user.id,
        reporterName: user.nickname,
        reason: disputeReason.trim(),
        expectation: disputeExpectation.trim(),
      });
      setDisputeOpen(false);
      setDisputeReason("");
      setDisputeExpectation("");
      await refetchDisputes();
      toast({ title: "投诉/纠纷已提交", description: "平台管理员会在后台审核中心处理并留存记录。" });
    } catch (e: unknown) {
      toast({ title: "提交失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setStageActionBusy(false);
    }
  }

  function getApplyButton() {
    if (!commission) return null;
    if (isPendingReview) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目审核中</Button>;
    if (isClosed) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目已关闭招募</Button>;
    if (isExpired) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目已截止</Button>;
    if (acceptedApplicant) return <Button className="w-full rounded-full text-base" size="lg" disabled>项目已进入合作中</Button>;
    if (!user) return <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/login')}>登录后应征</Button>;
    if (isProjectOwner) return <Button className="w-full rounded-full text-base" size="lg" disabled>不能应征自己的项目</Button>;
    if (user.role !== 'aigcer') return <Button className="w-full rounded-full text-base" size="lg" disabled>仅创作者可应征</Button>;
    if (user.verificationStatus !== 'verified') return <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/onboarding/aigcer')}>完成认证后应征</Button>;
    if (hasApplied) return <Button className="w-full rounded-full text-base" size="lg" disabled>已提交应征</Button>;
    return <Button className="w-full rounded-full text-base" size="lg" onClick={() => setApplyOpen(true)}>应征项目</Button>;
  }

  if (!Number.isFinite(commissionId)) {
    return <><Navbar /><EmptyState title="项目地址无效" description="请从项目列表重新选择一个需求。" actionLabel="返回项目列表" onAction={() => navigate('/commissions')} /></>;
  }

  if (isLoading) return <div className="min-h-screen bg-muted"><Navbar /><PageLoading label="正在加载项目详情..." /></div>;
  if (isError) return <div className="min-h-screen bg-muted"><Navbar /><div className="mx-auto max-w-3xl px-4 py-10"><ErrorState onAction={() => refetch()} /></div></div>;
  if (!commission) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState title="项目不存在或已下架" description="该需求可能已被关闭，建议返回列表查看其它机会。" actionLabel="返回项目列表" onAction={() => navigate('/commissions')} />
        </div>
      </div>
    );
  }

  if (commission.status === 'pending_review' && !isProjectOwner && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-10">
          <EmptyState title="项目正在审核中" description="该需求通过平台审核后，才会开放给创作者查看和应征。" actionLabel="返回项目列表" onAction={() => navigate('/commissions')} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex gap-6">
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-3xl">🎬</div>
              <h3 className="mb-2 font-semibold text-card-foreground">{commission.authorNickname}</h3>
              <div className="mb-1 flex items-center justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${index < (commission.rating ?? 5) ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                ))}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">共 {commission.reviews ?? 0} 条评价</p>
              <div className="mb-4 flex items-center justify-center gap-1 text-xs text-primary">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{commission.authorVerification === 'enterprise' ? '已完成企业认证' : commission.authorVerification === 'realname' ? '已完成实名认证' : '暂未认证'}</span>
              </div>
              <p className="mb-1 text-sm text-muted-foreground">需求完成率 {commission.completionRate ?? '0 / 0'}</p>
              <Badge variant="outline" className="text-xs">{commission.reputation}</Badge>
            </div>

            <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
              <div><p className="text-xs text-muted-foreground">交付日期</p><p className="text-lg font-bold text-primary">{commission.deadline}</p></div>
              <div><p className="text-xs text-muted-foreground">项目报酬预算</p><p className="text-lg font-bold text-price">{commission.priceRange}</p></div>
              <div><p className="text-xs text-muted-foreground">平台托管服务费</p><p className="text-lg font-bold text-primary">{commission.handlingFee ?? '5%'}</p></div>
              <p className="text-xs text-muted-foreground">{isExpired ? "项目已截止" : `${daysLeft} 天后关闭项目`}</p>
              {getApplyButton()}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <button className="flex items-center gap-1 transition-colors hover:text-primary" onClick={handleShare}><Share2 className="h-3.5 w-3.5" />分享项目</button>
              <Link to="/commissions" className="flex items-center gap-1 transition-colors hover:text-primary"><ChevronLeft className="h-3.5 w-3.5" />返回列表</Link>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
              <div className="mb-2 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-card-foreground">{commission.title}</h1>
                <Badge variant={isExpired || isClosed ? "secondary" : "outline"} className="flex-shrink-0 text-xs">{isPendingReview ? "审核中" : isClosed ? "已关闭" : isExpired ? "已截止" : "审核项目"}</Badge>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>发布方 {commission.authorNickname}</span>
                <span>{commission.purpose}</span>
                <span>{commission.category}</span>
                <span>{commission.applicants} 人应征</span>
              </div>

              <div className="mb-6 rounded-lg bg-accent/50 p-5">
                <h3 className="mb-4 text-center font-bold text-primary">承制流程</h3>
                <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-5">
                  {projectStages.map((item) => (
                    <div key={item.label} className="rounded-lg bg-background p-3 text-center shadow-sm">
                      <div className="mx-auto mb-2 h-2 w-full rounded-full bg-border">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
                      </div>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="mb-3 text-lg font-bold text-primary">需求详情</h2>
              <p className="mb-6 text-sm leading-7 text-foreground">{commission.description}</p>

              <h2 className="mb-3 text-lg font-bold text-primary">影片要求</h2>
              <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">影片类别：</span>{commission.category}</div>
                <div><span className="text-muted-foreground">用途：</span>{commission.purpose}</div>
                <div><span className="text-muted-foreground">文件格式：</span>{commission.format || 'MP4、MOV'}</div>
                <div><span className="text-muted-foreground">反馈节奏：</span>按节点提交并确认</div>
              </div>

              <h2 className="mb-3 text-lg font-bold text-primary">项目流程</h2>
              <div className="rounded-lg bg-accent/30 p-4 text-sm text-secondary">
                需求方选定合作 AIGCer 后，项目报酬将进入平台托管；创作者按节点提交概念稿、分镜和粗剪，需求方验收后确认交付。
              </div>
              <div className="mt-6">
                <Progress value={acceptedApplicant && currentStage ? currentStage.percent : isExpired ? 100 : 0} className="h-2" />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  {projectStages.map((item) => <span key={item.label}>{item.label}</span>)}
                </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project Admin</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">项目管理</h2>
                    <p className="mt-1 text-sm text-muted-foreground">编辑需求、关闭招募或移除无效项目。</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-full" onClick={() => navigate(`/commissions/${commission.id}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" />编辑
                    </Button>
                    <Button variant="outline" className="rounded-full" disabled={isClosed} onClick={() => setProjectAction('close')}>
                      <XCircle className="mr-2 h-4 w-4" />关闭招募
                    </Button>
                    <Button variant="destructive" className="rounded-full" onClick={() => setProjectAction('delete')}>
                      <Trash2 className="mr-2 h-4 w-4" />删除
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {acceptedApplicant && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-accent/60 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project Started</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">已选定 {acceptedApplicant.aigcerNickname}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      当前项目已进入合作中。后续每个关键节点都需要乙方提交，甲方反馈或确认后才会进入下一项。
                    </p>
                  </div>
                  <Badge className="w-fit rounded-full bg-primary text-primary-foreground">合作中</Badge>
                </div>
              </div>
            )}

            {acceptedApplicant && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project Contract</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">合作合同</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      合同签署为模拟流程，用于记录甲乙双方对项目范围、交付节点和托管付款安排的确认。
                    </p>
                  </div>
                  {projectContract && (
                    <Badge variant={projectContract.status === 'active' ? 'default' : 'outline'} className="w-fit rounded-full">
                      {contractStatusText}
                    </Badge>
                  )}
                </div>

                {!projectContract ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">生成合同草稿后，双方可以分别确认签署。</p>
                      <p className="mt-1">草稿会自动带入项目预算、交付格式、里程碑和当前托管说明。</p>
                    </div>
                    <Button
                      className="rounded-full"
                      onClick={handleCreateContractDraft}
                      disabled={!isProjectOwner || contractBusy}
                    >
                      {contractBusy ? "处理中..." : "生成合同草稿"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">甲方</p>
                        <p className="mt-1 font-semibold text-foreground">{projectContract.clientName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{projectContract.clientSignedAt ? '已签署' : '待签署'}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">乙方</p>
                        <p className="mt-1 font-semibold text-foreground">{projectContract.aigcerName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{projectContract.aigcerSignedAt ? '已签署' : '待签署'}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">项目预算</p>
                        <p className="mt-1 font-semibold text-foreground">{projectContract.budgetText}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{contractStatusText}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        合同摘要
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">交付格式</p>
                          <p className="mt-1 text-foreground">{projectContract.deliveryFormat}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">里程碑</p>
                          <p className="mt-1 text-foreground">{projectContract.milestoneSummary}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground">付款安排</p>
                          <p className="mt-1 text-foreground">{projectContract.escrowSummary}</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg bg-muted p-3 text-sm leading-6 text-muted-foreground whitespace-pre-line">
                        {projectContract.terms}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        双方都完成签署后合同状态会变为已生效，后续交付和托管释放可按合同摘要推进。
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={projectContract.clientSignedAt ? "outline" : "default"}
                          className="rounded-full"
                          onClick={() => handleSignContract('client')}
                          disabled={!isProjectOwner || contractBusy || !!projectContract.clientSignedAt}
                        >
                          {projectContract.clientSignedAt ? "甲方已签署" : "甲方确认签署"}
                        </Button>
                        <Button
                          variant={projectContract.aigcerSignedAt ? "outline" : "default"}
                          className="rounded-full"
                          onClick={() => handleSignContract('aigcer')}
                          disabled={!isAcceptedAigcer || contractBusy || !!projectContract.aigcerSignedAt}
                        >
                          {projectContract.aigcerSignedAt ? "乙方已签署" : "乙方确认签署"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {acceptedApplicant && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Escrow Payment</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">托管付款</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      资金托管为模拟流程，用于展示按里程碑配置比例、验收后释放款项的交易闭环。
                    </p>
                  </div>
                  {escrowBundle && (
                    <Badge variant={escrowBundle.plan.status === 'draft' ? 'outline' : 'default'} className="w-fit rounded-full">
                      {escrowBundle.plan.status === 'completed' ? '已全部释放' : escrowBundle.plan.status === 'funded' ? '已托管' : '待确认托管'}
                    </Badge>
                  )}
                </div>

                {!escrowBundle ? (
                  <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <Label>模拟托管总额</Label>
                      <Input
                        className="mt-1"
                        inputMode="numeric"
                        value={escrowAmountInput}
                        onChange={(event) => setEscrowAmountInput(event.target.value)}
                        disabled={!isProjectOwner || escrowBusy}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        默认按项目预算上限预填，可在创建计划前调整。
                      </p>
                    </div>
                    <Button
                      className="rounded-full"
                      onClick={handleCreateEscrowDraft}
                      disabled={!isProjectOwner || escrowBusy || Number(escrowAmountInput) <= 0}
                    >
                      {escrowBusy ? "处理中..." : "创建托管计划"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">托管总额</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(escrowBundle.plan.totalAmount)}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">已释放</p>
                        <p className="mt-1 text-lg font-bold text-primary">{formatCurrency(escrowReleasedAmount)}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">待释放</p>
                        <p className="mt-1 text-lg font-bold text-foreground">{formatCurrency(escrowPendingAmount)}</p>
                      </div>
                      <div className="rounded-xl bg-muted p-4">
                        <p className="text-xs text-muted-foreground">比例合计</p>
                        <p className={`mt-1 text-lg font-bold ${escrowPercentTotal === 100 ? 'text-foreground' : 'text-destructive'}`}>
                          {escrowPercentTotal}%
                        </p>
                      </div>
                    </div>

                    <Progress value={escrowReleaseProgress} className="h-2" />

                    <div className="grid gap-3 md:grid-cols-2">
                      {escrowBundle.milestones.map((milestone) => {
                        const percent = Number(escrowPercentInputs[milestone.id] ?? milestone.percent);
                        const amount = escrowBundle.plan.totalAmount * percent / 100;
                        return (
                          <div key={milestone.id} className="rounded-xl border border-border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{milestone.stageLabel}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(amount)}</p>
                              </div>
                              <Badge variant={milestone.status === 'released' ? 'default' : 'outline'} className="rounded-full">
                                {milestone.status === 'released' ? '已释放' : '待释放'}
                              </Badge>
                            </div>
                            {escrowBundle.plan.status === 'draft' && isProjectOwner ? (
                              <div className="mt-3 flex items-center gap-2">
                                <Input
                                  className="h-9"
                                  inputMode="decimal"
                                  value={escrowPercentInputs[milestone.id] ?? String(milestone.percent)}
                                  onChange={(event) => setEscrowPercentInputs((prev) => ({ ...prev, [milestone.id]: event.target.value }))}
                                  disabled={escrowBusy}
                                />
                                <span className="text-sm text-muted-foreground">%</span>
                              </div>
                            ) : (
                              <p className="mt-3 text-xs text-muted-foreground">付款比例 {milestone.percent}%</p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {escrowBundle.plan.status === 'draft' && isProjectOwner && (
                      <div className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          确认托管后比例将锁定，后续会在甲方确认节点时释放对应款项。
                        </p>
                        <Button
                          className="rounded-full"
                          onClick={handleFundEscrowPlan}
                          disabled={escrowBusy || escrowPercentTotal !== 100}
                        >
                          {escrowBusy ? "处理中..." : "确认托管（模拟）"}
                        </Button>
                      </div>
                    )}

                    {escrowBundle.releases.length > 0 && (
                      <div className="rounded-xl border border-border p-4">
                        <p className="mb-3 text-sm font-semibold text-foreground">释放流水</p>
                        <div className="space-y-2">
                          {escrowBundle.releases.slice(0, 5).map((release) => (
                            <div key={release.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 text-sm">
                              <span className="text-foreground">{release.stageLabel}</span>
                              <span className="font-semibold text-primary">{formatCurrency(release.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {acceptedApplicant && currentStage && (
              <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Delivery Control</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground">合作节点管理</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      当前阶段：{currentStage.label}。{progressStatusText}
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full">{currentStage.percent}%</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {projectStages.map((stage, index) => {
                    const done = index < currentStageIndex || progressCompleted;
                    const active = index === currentStageIndex && !progressCompleted;
                    return (
                      <div key={stage.id} className={`rounded-xl border p-3 text-sm ${done ? 'border-primary/30 bg-accent text-foreground' : active ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-muted/40 text-muted-foreground'}`}>
                        <div className={`mb-2 h-2 rounded-full ${done ? 'bg-primary' : active ? 'bg-primary/60' : 'bg-border'}`} />
                        <p className="font-medium">{stage.label}</p>
                        {active && <p className="mt-1 text-xs text-muted-foreground">{progress?.stageStatus === 'waiting_owner' ? '待甲方确认' : '待乙方提交'}</p>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    {canSubmitStage
                      ? '请提交当前节点内容，提交后将等待甲方反馈或确认。'
                      : canConfirmStage
                        ? '乙方已提交当前节点，请确认无误后进入下一项。'
                        : progressStatusText}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {canConfirmStage && (
                      <Button variant="outline" className="rounded-full" onClick={() => setFeedbackOpen(true)} disabled={stageActionBusy}>
                        要求修改
                      </Button>
                    )}
                    <Button className="rounded-full" onClick={handleStageActionV2} disabled={!canActOnStage || stageActionBusy}>
                      {stageActionBusy ? "处理中..." : progressActionLabel}
                    </Button>
                  </div>
                </div>
                {acceptedApplicant && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
                    <div className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">交付记录</p>
                        <Badge variant="secondary" className="rounded-full">{currentDelivery ? "当前待确认" : `${deliveries.length} 条`}</Badge>
                      </div>
                      <div className="space-y-3">
                        {deliveries.length === 0 && (
                          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">还没有交付记录，乙方提交当前节点后会在这里形成版本记录。</p>
                        )}
                        {deliveries.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-lg bg-muted p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-foreground">{item.stageLabel} V{item.version}</span>
                              <Badge variant="outline" className="rounded-full">
                                {item.status === 'confirmed' ? '已确认' : item.status === 'changes_requested' ? '需修改' : '待确认'}
                              </Badge>
                            </div>
                            <p className="mt-2 text-muted-foreground">{item.description}</p>
                            {item.fileUrl && (
                              <a className="mt-2 inline-flex text-xs font-medium text-primary hover:underline" href={item.fileUrl} target="_blank" rel="noreferrer">
                                查看附件：{item.fileName}
                              </a>
                            )}
                            {item.feedback && <p className="mt-2 rounded-md bg-background p-2 text-xs text-muted-foreground">反馈：{item.feedback}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm font-semibold text-foreground">争议处理</p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">交付范围、修改次数、验收结果有争议时，可提交平台介入，后台会形成审核日志。</p>
                      <Button variant="outline" className="mt-4 w-full rounded-full" onClick={() => setDisputeOpen(true)}>
                        <ShieldAlert className="mr-2 h-4 w-4" /> 发起投诉/纠纷
                      </Button>
                      {disputes.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">已有 {disputes.length} 条纠纷记录，最近状态：{disputes[0].status}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {canViewApplicantPanel && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Smart Matching</p>
                  <h2 className="mt-1 text-lg font-bold text-card-foreground">应征AIGCer决策面板</h2>
                  <p className="mt-1 text-sm text-muted-foreground">先看总体排序，再进入单个候选人的匹配解释。</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab('all')} className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}>全部应征</button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('smart');
                      runMatch(commission.description, commission.category, applicants);
                    }}
                    className={`min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'smart' ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
                  >
                    <WandSparkles className="mr-1 inline h-4 w-4" />智能推荐
                  </button>
                </div>
              </div>

              {activeTab === 'smart' && (
                <div className="mb-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-accent/50 p-4">
                    <BrainCircuit className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">{scores ? "已生成" : "待生成"}</p>
                    <p className="text-xs text-muted-foreground">AI 匹配状态</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-4">
                    <Gauge className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">
                      {scores?.length ? Math.max(...scores.map((item) => item.score)) : "--"}%
                    </p>
                    <p className="text-xs text-muted-foreground">最高匹配度</p>
                  </div>
                  <div className="rounded-xl bg-accent/50 p-4">
                    <MessageCircle className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-lg font-bold text-foreground">{applicants.length}</p>
                    <p className="text-xs text-muted-foreground">可沟通候选人</p>
                  </div>
                </div>
              )}

              {matchLoading && <PageLoading label="AI 正在分析匹配度..." />}
              {matchError && <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{matchError}</div>}
              {!matchLoading && sortedApplicants.length === 0 ? (
                <EmptyState title="暂无AIGCer应征" description="你可以分享项目链接，或稍后回来查看新的应征信息。" />
              ) : (
                <div className="space-y-3">
                  {sortedApplicants.map((applicant) => {
                    const score = getScore(applicant.aigcerId);
                    const match = getMatchResult(applicant.aigcerId);
                    const recommendation = getRecommendation(score);
                    return (
                      <div key={applicant.id} className="rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{applicant.aigcerNickname}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${recommendation.className}`}>{recommendation.label}</span>
                              <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                {applicant.status === 'accepted' ? '已选定' : applicant.status === 'rejected' ? '已拒绝' : applicant.status === 'withdrawn' ? '已撤回' : '待沟通'}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-muted-foreground">{applicant.message}</p>
                            {activeTab === 'smart' && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {(match?.matchedTags?.length ? match.matchedTags.slice(0, 3) : getMatchReasons(applicant).slice(0, 2)).map((reason) => (
                                  <span key={reason} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">{reason}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-4 md:flex-col md:items-end">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-foreground"
                                style={{ background: `conic-gradient(hsl(var(--primary)) ${(score ?? 0) * 3.6}deg, hsl(var(--muted)) 0deg)` }}
                              >
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card">
                                  {score !== null ? `${score}` : "--"}
                                </div>
                              </div>
                              <div className="md:text-right">
                                <p className="text-xs text-muted-foreground">期望报酬</p>
                                <p className="text-sm font-semibold text-price">{applicant.expectedPrice}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSelectedApplicantId(applicant.id)}>
                                查看解释
                              </Button>
                              {user?.id === applicant.aigcerId && applicant.status === 'pending' && (
                                <>
                                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => openApplicationEdit(applicant.id)}>
                                    修改
                                  </Button>
                                  <Button variant="outline" size="sm" className="rounded-full" disabled={applicationActionId === applicant.id} onClick={() => setWithdrawTargetId(applicant.id)}>
                                    撤回
                                  </Button>
                                </>
                              )}
                              {isProjectOwner && applicant.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    disabled={applicationActionId === applicant.id}
                                    onClick={() => handleApplicationStatus(applicant.id, 'rejected')}
                                  >
                                    拒绝
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-full"
                                    disabled={applicationActionId === applicant.id}
                                    onClick={() => handleApplicationStatus(applicant.id, 'accepted')}
                                  >
                                    {applicationActionId === applicant.id ? '处理中...' : '选定合作'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
          </main>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        {getApplyButton()}
      </div>

      <Dialog open={deliveryOpen} onOpenChange={setDeliveryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>提交当前交付节点</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>交付标题</Label>
              <Input className="mt-1" value={deliveryTitle} onChange={(event) => setDeliveryTitle(event.target.value)} />
            </div>
            <div>
              <Label>交付说明</Label>
              <Textarea className="mt-1" rows={4} placeholder="说明本次提交的内容、版本范围、需要甲方重点确认的点..." value={deliveryDescription} onChange={(event) => setDeliveryDescription(event.target.value)} />
            </div>
            <div>
              <Label>附件</Label>
              <label className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/60 px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent">
                <UploadCloud className="mb-2 h-5 w-5 text-primary" />
                <span>{deliveryFile ? deliveryFile.name : "上传脚本、风格图、分镜、视频文件或压缩包"}</span>
                <input type="file" className="hidden" onChange={(event) => setDeliveryFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryOpen(false)}>取消</Button>
            <Button onClick={handleSubmitDelivery} disabled={stageActionBusy || deliveryTitle.trim().length < 2 || deliveryDescription.trim().length < 8}>
              {stageActionBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : "提交交付物"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>要求修改</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">请写清楚需要调整的内容，当前节点会回到乙方待提交状态，反馈会进入版本记录。</p>
            <Textarea rows={5} placeholder="例如：第 3 镜头需要补产品近景；片尾品牌露出延长 1 秒..." value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>取消</Button>
            <Button onClick={handleRequestChanges} disabled={stageActionBusy || feedbackText.trim().length < 6}>发送修改意见</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>发起投诉/纠纷</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>问题说明</Label>
              <Textarea className="mt-1" rows={4} placeholder="说明争议发生在哪个节点、双方分歧是什么、已有沟通结果..." value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} />
            </div>
            <div>
              <Label>希望平台如何处理</Label>
              <Textarea className="mt-1" rows={3} placeholder="例如：协助确认交付范围、要求补充修改、冻结节点确认..." value={disputeExpectation} onChange={(event) => setDisputeExpectation(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>取消</Button>
            <Button onClick={handleCreateDispute} disabled={stageActionBusy || disputeReason.trim().length < 8 || disputeExpectation.trim().length < 4}>提交平台处理</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>应征项目</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>应征留言</Label>
              <Textarea className="mt-1" rows={4} placeholder="介绍你的优势、创作思路、预计交付节奏..." value={applyMessage} onChange={(event) => setApplyMessage(event.target.value)} />
              <p className="mt-1 text-right text-xs text-muted-foreground">{applyMessage.length}/200</p>
            </div>
            <div>
              <Label>期望报酬</Label>
              <Input className="mt-1" placeholder="如：¥5000" value={expectedPrice} onChange={(event) => setExpectedPrice(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>取消</Button>
            <Button onClick={handleApply} disabled={applyMessage.trim().length < 10 || !expectedPrice.trim() || applying}>
              {applying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />提交中...</> : "确认应征"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicantId(null)}>
        <DialogContent className="max-w-2xl">
          {selectedApplicant && (
            <>
              <DialogHeader>
                <DialogTitle>智能推荐解释</DialogTitle>
              </DialogHeader>
              {(() => {
                const score = getScore(selectedApplicant.aigcerId);
                const match = getMatchResult(selectedApplicant.aigcerId);
                const matchedPortfolio = getMatchedPortfolio(selectedApplicant);
                const recommendation = getRecommendation(score);
                return (
                  <div className="space-y-5">
                    <div className="grid gap-4 rounded-2xl border border-border bg-accent/50 p-5 md:grid-cols-[auto_1fr]">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-foreground"
                        style={{ background: `conic-gradient(hsl(var(--primary)) ${(score ?? 0) * 3.6}deg, hsl(var(--muted)) 0deg)` }}
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                          {score !== null ? `${score}%` : "--"}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className={recommendation.className}>{recommendation.label}</Badge>
                          <Badge variant="outline">{selectedApplicant.status === 'accepted' ? '已选定' : '待沟通'}</Badge>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{selectedApplicant.aigcerNickname}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.summary}</p>
                        {!!match?.matchedTags?.length && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {match.matchedTags.slice(0, 6).map((tag) => (
                              <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { icon: UserRound, title: "创作者资料", desc: selectedApplicant.bio || "简介资料较少" },
                        { icon: Sparkles, title: "擅长风格", desc: selectedApplicant.styles.join("、") || "暂未填写" },
                        { icon: BadgeCheck, title: "工具链", desc: selectedApplicant.tools.join("、") || "暂未填写" },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="rounded-xl border border-border p-4">
                            <Icon className="mb-3 h-5 w-5 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                            <p className="mt-1 line-clamp-4 text-xs leading-5 text-muted-foreground">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {matchedPortfolio.length > 0 && (
                      <div className="rounded-xl border border-border p-4">
                        <p className="mb-3 text-sm font-semibold text-foreground">匹配作品</p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {matchedPortfolio.map((item) => (
                            <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-muted/30">
                              <img src={item.imageUrl} alt={item.title} className="aspect-video w-full object-cover" />
                              <div className="p-3">
                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl border border-border p-4">
                      <p className="mb-3 text-sm font-semibold text-foreground">AI 判断依据</p>
                      <div className="space-y-2">
                        {getMatchReasons(selectedApplicant).map((reason) => (
                          <div key={reason} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted p-4">
                      <p className="text-sm font-semibold text-foreground">建议下一步</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        先确认档期、报价包含范围、首版样片节点和修改次数。匹配度只辅助排序，最终仍建议结合过往案例和沟通质量判断。
                      </p>
                    </div>
                  </div>
                );
              })()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedApplicantId(null)}>关闭</Button>
                {isProjectOwner && selectedApplicant.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      disabled={applicationActionId === selectedApplicant.id}
                      onClick={() => handleApplicationStatus(selectedApplicant.id, 'rejected')}
                    >
                      拒绝应征
                    </Button>
                    <Button
                      disabled={applicationActionId === selectedApplicant.id}
                      onClick={() => handleApplicationStatus(selectedApplicant.id, 'accepted')}
                    >
                      {applicationActionId === selectedApplicant.id ? '处理中...' : '选定合作'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingApplicationId} onOpenChange={(open) => !open && setEditingApplicationId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>修改应征信息</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>应征留言</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={editApplicationMessage}
                onChange={(event) => setEditApplicationMessage(event.target.value)}
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">{editApplicationMessage.length}/200</p>
            </div>
            <div>
              <Label>期望报酬</Label>
              <Input
                className="mt-1"
                value={editApplicationPrice}
                onChange={(event) => setEditApplicationPrice(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingApplicationId(null)}>取消</Button>
            <Button
              onClick={handleSaveApplicationEdit}
              disabled={!editApplicationMessage.trim() || !editApplicationPrice.trim() || applicationActionId === editingApplicationId}
            >
              {applicationActionId === editingApplicationId ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!withdrawTargetId} onOpenChange={(open) => !open && setWithdrawTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>撤回应征？</AlertDialogTitle>
            <AlertDialogDescription>
              撤回后，需求方将不再把你作为该项目的候选人。若之后想再次应征，需要重新提交。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawApplication}>确认撤回</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!projectAction} onOpenChange={(open) => !open && setProjectAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{projectAction === 'delete' ? '删除项目？' : '关闭招募？'}</AlertDialogTitle>
            <AlertDialogDescription>
              {projectAction === 'delete'
                ? '删除后，项目详情和相关应征记录会被移除。这个操作适合误发布或无效项目。'
                : '关闭后，项目仍可查看，但新的创作者不能继续应征，已有应征仍保留。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleProjectAction}>
              {projectAction === 'delete' ? '确认删除' : '确认关闭'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
