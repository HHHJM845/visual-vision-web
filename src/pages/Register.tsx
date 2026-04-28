import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { register as registerUser } from "@/services/authService";
import { UserRole } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  nickname: z.string().min(2, "昵称至少2个字"),
  password: z.string().min(6, "密码至少6位"),
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'client' ? 'client' : 'aigcer';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setError("");
    try {
      const user = await registerUser({
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        role,
      });
      setUser(user);
      toast({ title: "注册成功", description: "继续完成身份认证即可使用完整功能。" });
      navigate(role === 'client' ? '/onboarding/client' : '/onboarding/aigcer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "注册失败");
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <img src="/logo.png" alt="跃然承制" className="w-8 h-8 object-contain" />
            跃然承制
          </Link>
          <p className="text-muted-foreground text-sm mt-2">创建新账号</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {([['aigcer', '🎬', '我是AIGCer', '接项目·展示作品'], ['client', '📋', '我是需求方', '发项目·找承制']] as const).map(
            ([r, emoji, title, sub]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  role === r
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </button>
            )
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" type="email" placeholder="请输入邮箱地址" className="mt-1" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="nickname">昵称</Label>
            <Input id="nickname" placeholder="你的展示名称" className="mt-1" {...register("nickname")} />
            {errors.nickname && <p className="text-destructive text-xs mt-1">{errors.nickname.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="至少6位" className="mt-1" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "注册中..." : "注册并继续"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          已有账号？{" "}
          <Link to="/login" className="text-primary hover:underline">立即登录</Link>
        </p>
      </div>
    </div>
  );
}
