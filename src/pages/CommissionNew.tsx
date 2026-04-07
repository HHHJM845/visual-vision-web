import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createCommission } from "@/services/commissionService";

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

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'client' || user.verificationStatus !== 'verified') {
    navigate('/dashboard/client'); return null;
  }

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { purpose: "商业用途" },
  });

  async function onSubmit(data: FormValues) {
    const tag = user!.clientVerificationType === 'enterprise' ? '企业认证' as const : '实名认证' as const;
    const authorVerification = user!.clientVerificationType === 'enterprise' ? 'enterprise' as const : 'realname' as const;

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
    navigate('/dashboard/client');
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
              <Label>需求描述</Label>
              <Textarea className="mt-1" rows={4} placeholder="详细描述影片风格、时长、用途、参考案例等..." {...register("description")} />
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
              {isSubmitting ? "发布中..." : "发布项目"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
