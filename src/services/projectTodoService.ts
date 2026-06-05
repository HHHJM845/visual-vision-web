import { Application, Commission, DeliverySubmission } from '@/types/commission';
import { ProjectContract } from '@/types/contract';
import { EscrowBundle } from '@/types/escrow';
import { ProjectProgress, projectStages } from '@/services/commissionService';

export interface ProjectTodo {
  id: string;
  title: string;
  description: string;
  commissionId: number;
  commissionTitle: string;
  targetPath: string;
  actionLabel: string;
  priority: number;
}

export interface ClientTodoInput {
  commissions: Commission[];
  applications: Application[];
  contractsByCommission: Record<number, ProjectContract | null | undefined>;
  escrowByCommission: Record<number, EscrowBundle | null | undefined>;
  progressByCommission: Record<number, ProjectProgress | null | undefined>;
  deliveriesByCommission: Record<number, DeliverySubmission[] | undefined>;
}

export interface AigcerTodoInput {
  applications: Application[];
  commissionsById: Record<number, Commission | null | undefined>;
  contractsByCommission: Record<number, ProjectContract | null | undefined>;
  progressByCommission: Record<number, ProjectProgress | null | undefined>;
  deliveriesByCommission: Record<number, DeliverySubmission[] | undefined>;
}

function todoBase(commission: Commission) {
  return {
    commissionId: commission.id,
    commissionTitle: commission.title,
    targetPath: `/commissions/${commission.id}`,
  };
}

function sortAndLimit(todos: ProjectTodo[]) {
  return [...todos].sort((a, b) => a.priority - b.priority).slice(0, 3);
}

function acceptedForCommission(applications: Application[], commissionId: number) {
  return applications.find((application) => (
    application.commissionId === commissionId && application.status === 'accepted'
  ));
}

function latestDelivery(deliveries: DeliverySubmission[] = []) {
  return [...deliveries].sort((a, b) => (
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  ))[0];
}

export function buildClientTodos(input: ClientTodoInput): ProjectTodo[] {
  const todos: ProjectTodo[] = [];

  for (const commission of input.commissions) {
    const accepted = acceptedForCommission(input.applications, commission.id);
    if (!accepted) continue;

    const contract = input.contractsByCommission[commission.id];
    const escrow = input.escrowByCommission[commission.id];
    const progress = input.progressByCommission[commission.id];

    if (!contract) {
      todos.push({
        id: `contract-create-${commission.id}`,
        ...todoBase(commission),
        title: '生成合作合同',
        description: `已选定 ${accepted.aigcerNickname}，请生成合同草稿并发起双方确认。`,
        actionLabel: '生成合同',
        priority: 10,
      });
    } else if (!contract.clientSignedAt) {
      todos.push({
        id: `contract-client-sign-${commission.id}`,
        ...todoBase(commission),
        title: '签署合作合同',
        description: '合同草稿已生成，请完成甲方确认签署。',
        actionLabel: '签署合同',
        priority: 10,
      });
    }

    if (escrow?.plan.status === 'frozen') {
      todos.push({
        id: `escrow-frozen-${commission.id}`,
        ...todoBase(commission),
        title: '等待平台处理纠纷',
        description: '当前节点款项已冻结，请等待后台处理结果后再继续确认交付。',
        actionLabel: '查看纠纷',
        priority: 5,
      });
    } else if (progress?.stageStatus === 'waiting_owner') {
      const stage = projectStages.find((item) => item.id === progress.currentStage);
      todos.push({
        id: `delivery-confirm-${commission.id}-${progress.currentStage}`,
        ...todoBase(commission),
        title: '确认交付节点',
        description: `${accepted.aigcerNickname} 已提交${stage?.label ?? '当前节点'}，请确认或要求修改。`,
        actionLabel: '确认交付',
        priority: 20,
      });
    }

    if (!escrow) {
      todos.push({
        id: `escrow-create-${commission.id}`,
        ...todoBase(commission),
        title: '创建托管计划',
        description: '项目已进入合作，请创建模拟托管计划以衔接后续节点释放。',
        actionLabel: '创建托管',
        priority: 30,
      });
    } else if (escrow.plan.status === 'draft') {
      todos.push({
        id: `escrow-fund-${commission.id}`,
        ...todoBase(commission),
        title: '确认托管计划',
        description: '托管比例仍是草稿状态，请确认后锁定付款节点。',
        actionLabel: '确认托管',
        priority: 30,
      });
    }
  }

  return sortAndLimit(todos);
}

export function buildAigcerTodos(input: AigcerTodoInput): ProjectTodo[] {
  const todos: ProjectTodo[] = [];

  for (const application of input.applications) {
    if (application.status !== 'accepted') continue;
    const commission = input.commissionsById[application.commissionId];
    if (!commission) continue;

    const contract = input.contractsByCommission[commission.id];
    const progress = input.progressByCommission[commission.id];
    const latest = latestDelivery(input.deliveriesByCommission[commission.id]);

    if (contract && !contract.aigcerSignedAt) {
      todos.push({
        id: `contract-aigcer-sign-${commission.id}`,
        ...todoBase(commission),
        title: '签署合作合同',
        description: `${contract.clientName} 已发起合同，请确认项目范围和付款安排。`,
        actionLabel: '签署合同',
        priority: 10,
      });
    }

    if (latest?.status === 'changes_requested') {
      todos.push({
        id: `delivery-revise-${commission.id}-${latest.id}`,
        ...todoBase(commission),
        title: '修改交付内容',
        description: latest.feedback ? `甲方反馈：${latest.feedback}` : '甲方已要求修改当前交付内容。',
        actionLabel: '修改交付',
        priority: 20,
      });
    }

    if (progress?.stageStatus === 'waiting_aigcer') {
      const stage = projectStages.find((item) => item.id === progress.currentStage);
      todos.push({
        id: `delivery-submit-${commission.id}-${progress.currentStage}`,
        ...todoBase(commission),
        title: '提交当前节点',
        description: `请提交${stage?.label ?? '当前节点'}，提交后将进入甲方确认。`,
        actionLabel: '提交节点',
        priority: 30,
      });
    }
  }

  return sortAndLimit(todos);
}
