import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { EmptyState, ErrorState, PageLoading, PermissionState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissionById, updateCommission } from "@/services/commissionService";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(5, "标题至少5个字"),
  description: z.string().min(20, "描述至少20个字"),
  category: z.string().min(1, "请选择类别"),
  priceMin: z.string().min(1, "请填写最低报酬"),
  priceMax: z.string().min(1, "请填写最高报酬"),
  deadline: z.string().min(1, "请选择截止日期"),
  purpose: z.enum(["商业用途", "个人用途"]),
  format: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIES = ["商业宣传片", "创意短片", "概念影像", "短视频", "动态海报", "AI动画"];

function splitPriceRange(priceRange = "") {
  const nums = priceRange.match(/\d+/g) ?? [];
  return {
    priceMin: nums[0] ?? "",
    priceMax: nums[1] ?? nums[0] ?? "",
  };
}

export default function CommissionEdit() {
  const { id } = useParams();
  const commissionId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState("");

  const { data: commission, isLoading, isError, refetch } = useQuery({
    queryKey: ["commission", commissionId],
    queryFn: () => getCommissionById(commissionId),
    enabled: Number.isFinite(commissionId),
  });

  const defaults = useMemo<FormValues | null>(() => {
    if (!commission) return null;
    return {
      title: commission.title,
      description: commission.description,
      category: commission.category,
      ...splitPriceRange(commission.priceRange),
      deadline: commission.deadline,
      purpose: commission.purpose,
      format: commission.format || "",
    };
  }, [commission]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purpose: "商业用途",
    },
  });

  useEffect(() => {
    if (defaults) reset(defaults);
  }, [defaults, reset]);

  async function onSubmit(data: FormValues) {
    setSubmitError("");
    if (!commission) return;
    if (new Date(data.deadline).getTime() < Date.now()) {
      setSubmitError("截止日期不能早于今天");
      return;
    }

    try {
      await updateCommission(commission.id, {
        title: data.title,
        description: data.description,
        category: data.category,
        priceRange: `¥${data.priceMin} - ${data.priceMax}`,
        deadline: data.deadline,
        purpose: data.purpose,
        format: data.format,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["commissions"] }),
        queryClient.invalidateQueries({ queryKey: ["commission", commission.id] }),
      ]);
      toast({ title: "项目已更新", description: "项目详情和广场列表已同步最新内容。" });
      navigate(`/commissions/${commission.id}`, { replace: true });
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "保存失败，请稍后重试");
    }
  }

  if (!Number.isFinite(commissionId)) {
    return <><Navbar /><EmptyState title="项目地址无效" description="请从项目列表重新选择一个需求。" actionLabel="返回项目列表" onAction={() => navigate("/commissions")} /></>;
  }

  if (!user) {
    return <div className="min-h-screen bg-muted"><Navbar /><PermissionState title="请先登录" description="编辑项目需要登录发布方账号。" actionLabel="去登录" onAction={() => navigate("/login")} /></div>;
  }

  if (isLoading) return <div className="min-h-screen bg-muted"><Navbar /><PageLoading label="正在加载项目..." /></div>;
  if (isError) return <div className="min-h-screen bg-muted"><Navbar /><div className="mx-auto max-w-3xl px-4 py-10"><ErrorState onAction={() => refetch()} /></div></div>;
  if (!commission) return <div className="min-h-screen bg-muted"><Navbar /><div className="mx-auto max-w-3xl px-4 py-10"><EmptyState title="项目不存在" actionLabel="返回项目列表" onAction={() => navigate("/commissions")} /></div></div>;
  if (commission.authorId !== user.id) {
    return <div className="min-h-screen bg-muted"><Navbar /><PermissionState title="没有编辑权限" description="只有项目发布方可以编辑这条需求。" actionLabel="返回项目详情" onAction={() => navigate(`/commissions/${commission.id}`)} /></div>;
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground">← 返回</button>
          <h1 className="text-xl font-bold">编辑项目</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <div>
              <Label>项目标题</Label>
              <Input className="mt-1" {...register("title")} />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label>需求描述</Label>
              <Textarea rows={5} className="mt-1" {...register("description")} />
              {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>影片类别</Label>
                <Select value={watch("category")} onValueChange={(value) => setValue("category", value, { shouldValidate: true })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
                {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
              </div>
              <div>
                <Label>用途</Label>
                <Select value={watch("purpose")} onValueChange={(value) => setValue("purpose", value as "商业用途" | "个人用途", { shouldValidate: true })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="商业用途">商业用途</SelectItem>
                    <SelectItem value="个人用途">个人用途</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>报酬区间（最低）</Label>
                <Input className="mt-1" {...register("priceMin")} />
                {errors.priceMin && <p className="mt-1 text-xs text-destructive">{errors.priceMin.message}</p>}
              </div>
              <div>
                <Label>报酬区间（最高）</Label>
                <Input className="mt-1" {...register("priceMax")} />
                {errors.priceMax && <p className="mt-1 text-xs text-destructive">{errors.priceMax.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>截止日期</Label>
                <Input type="date" className="mt-1" {...register("deadline")} />
                {errors.deadline && <p className="mt-1 text-xs text-destructive">{errors.deadline.message}</p>}
              </div>
              <div>
                <Label>影片格式</Label>
                <Input className="mt-1" {...register("format")} />
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => navigate(`/commissions/${commission.id}`)}>取消</Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />保存中...</> : "保存修改"}
            </Button>
          </div>
          {submitError && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
