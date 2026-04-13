import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/services/authService";

const schema = z.object({
  account: z.string().min(1, "请输入手机号或邮箱"),
  password: z.string().min(1, "请输入密码"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setError("");
    try {
      const user = await login({ account: data.account, password: data.password });
      setUser(user);
      navigate(user.role === 'client' ? '/dashboard/client' : '/dashboard/aigcer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登录失败");
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
          <p className="text-muted-foreground text-sm mt-2">登录你的账号</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="account">邮箱</Label>
            <Input id="account" type="email" placeholder="请输入邮箱地址" className="mt-1" {...register("account")} />
            {errors.account && <p className="text-destructive text-xs mt-1">{errors.account.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="请输入密码" className="mt-1" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          还没有账号？{" "}
          <Link to="/register" className="text-primary hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  );
}
