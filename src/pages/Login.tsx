import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { login as loginUser } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { assetUrl } from "@/lib/assets";
import { UserRole } from "@/types/user";

const schema = z.object({
  account: z.string().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码"),
});

type FormValues = z.infer<typeof schema>;

function dashboardPath(role: UserRole) {
  if (role === "admin") return "/admin";
  return role === "client" ? "/dashboard/client" : "/dashboard/aigcer";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) navigate(dashboardPath(user.role), { replace: true });
  }, [navigate, user]);

  async function onSubmit(data: FormValues) {
    setError("");
    try {
      const nextUser = await loginUser({ account: data.account, password: data.password });
      setUser(nextUser);
      toast({ title: "登录成功", description: "已进入你的工作台。" });
      const redirectTo = (location.state as { from?: string } | null)?.from || dashboardPath(nextUser.role);
      navigate(redirectTo, { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登录失败，请稍后重试");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
            <img src={assetUrl("logo.webp")} alt="跃然承制" className="h-8 w-8 object-contain" />
            跃然承制
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">登录你的账号</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="account">账号</Label>
            <Input id="account" placeholder="邮箱 / 管理员账号" className="mt-1" {...register("account")} />
            {errors.account && <p className="mt-1 text-xs text-destructive">{errors.account.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="请输入密码" className="mt-1" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          还没有账号？{" "}
          <Link to="/register" className="text-primary hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  );
}
