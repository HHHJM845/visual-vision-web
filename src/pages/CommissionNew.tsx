import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from 'lucide-react';
import Navbar from "@/components/Navbar";
import { PermissionState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from "@/contexts/AuthContext";
import { createCommission } from "@/services/commissionService";
import { useAIBrief } from '@/hooks/useAIBrief';
import { useToast } from '@/hooks/use-toast';

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

export default function CommissionNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { purpose: "商业用途" },
  });

  const { isLoading: aiLoading, result: aiResult, error: aiError, generate, reset } = useAIBrief();
  const [briefOpen, setBriefOpen] = useState(false);
  const [roughIdea, setRoughIdea] = useState('');

  async function handleGenerate() {
    await generate(roughIdea);
  }

  function handleUseBrief() {
    if (aiResult) {
      setValue('description', aiResult);
      setBriefOpen(false);
      reset();
      setRoughIdea('');
    }
  }

  function handleOpenBrief() {
    reset();
    setRoughIdea('');
    setBriefOpen(true);
  }

  async function onSubmit(data: FormValues) {
    setSubmitError("");
    if (new Date(data.deadline).getTime() < Date.now()) {
      setSubmitError("截止日期不能早于今天");
      return;
    }
    const tag = user!.clientVerificationType === 'enterprise' ? '企业认证' as const : '实名认证' as const;
    const authorVerification = user!.clientVerificationType === 'enterprise' ? 'enterprise' as const : 'realname' as const;

    try {
      await createCommission({
        title: data.title,
        description: data.description,
        category: data.category,
        priceRange: `¥${data.priceMin} - ${data.priceMax}`,
        deadline: data.deadline,
        purpose: data.purpose,
        format: data.format,
        tag,
        reputation: '信誉优良',
        authorId: user!.id,
        authorNickname: user!.nickname,
        authorVerification,
      });
      toast({ title: "项目已发布", description: "AIGCer 现在可以在项目广场看到这条需求。" });
      navigate('/dashboard/client');
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "发布失败，请稍后重试");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState title="请先登录" description="发布需求需要登录需求方账号。" actionLabel="去登录" onAction={() => navigate('/login')} />
      </div>
    );
  }

  if (user.role !== 'client' || user.verificationStatus !== 'verified') {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState title="暂时无法发布项目" description="只有完成认证的需求方账号可以发布项目。" actionLabel="去完成认证" onAction={() => navigate('/onboarding/client')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">← 返回</button>
          <h1 className="text-xl font-bold">发布新项目</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <Label>项目标题</Label>
              <Input className="mt-1" placeholder="简明描述你的需求，如「企业品牌AI宣传片制作」" {...register("title")} />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>需求描述</Label>
                <button
                  type="button"
                  onClick={handleOpenBrief}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  ✨ AI 优化
                </button>
              </div>
              <Textarea rows={4} placeholder="详细描述影片风格、时长、用途、参考案例等..." {...register("description")} />
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>影片类别</Label>
                <Select onValueChange={v => setValue("category", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <Label>用途</Label>
                <Select defaultValue="商业用途" onValueChange={v => setValue("purpose", v as "商业用途" | "个人用途")}>
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
                <Input className="mt-1" placeholder="如：3000" {...register("priceMin")} />
                {errors.priceMin && <p className="text-destructive text-xs mt-1">{errors.priceMin.message}</p>}
              </div>
              <div>
                <Label>报酬区间（最高）</Label>
                <Input className="mt-1" placeholder="如：8000" {...register("priceMax")} />
                {errors.priceMax && <p className="text-destructive text-xs mt-1">{errors.priceMax.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>截止日期</Label>
                <Input type="date" className="mt-1" {...register("deadline")} />
                {errors.deadline && <p className="text-destructive text-xs mt-1">{errors.deadline.message}</p>}
              </div>
              <div>
                <Label>影片格式（选填）</Label>
                <Input className="mt-1" placeholder="如：MP4、MOV" {...register("format")} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => navigate(-1)}>取消</Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />发布中...</> : "发布项目"}
            </Button>
          </div>
          {submitError && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">{submitError}</p>}
        </form>
      </div>

      <Dialog open={briefOpen} onOpenChange={setBriefOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>✨ AI 帮你写需求</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">
                用一句话说说你要什么
              </Label>
              <Textarea
                rows={2}
                placeholder="例如：我需要一个赛博朋克风格的60秒品牌宣传片"
                value={roughIdea}
                onChange={e => setRoughIdea(e.target.value)}
              />
            </div>
            {aiResult && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">AI 生成结果：</p>
                <p className="text-sm leading-relaxed">{aiResult}</p>
              </div>
            )}
            {aiError && <p className="text-destructive text-sm">{aiError}</p>}
          </div>
          <DialogFooter className="gap-2">
            {aiResult ? (
              <>
                <button
                  type="button"
                  onClick={() => { reset(); setRoughIdea(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  重新生成
                </button>
                <Button onClick={handleUseBrief}>使用这个描述</Button>
              </>
            ) : (
              <Button onClick={handleGenerate} disabled={!roughIdea.trim() || aiLoading}>
                {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</> : '生成描述'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
