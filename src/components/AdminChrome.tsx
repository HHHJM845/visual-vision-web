import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ListChecks, ScrollText, UsersRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PermissionState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "后台首页", path: "/admin", icon: LayoutDashboard },
  { label: "审核中心", path: "/admin/verifications", icon: ListChecks },
  { label: "用户列表", path: "/admin/users", icon: UsersRound },
  { label: "审核日志", path: "/admin/audit-log", icon: ScrollText },
];

export function AdminShell({ children, title, description, action }: {
  children: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState
          title="请先登录管理员账号"
          description="管理员后台需要使用 HHHJM 账号登录。"
          actionLabel="去登录"
          onAction={() => navigate("/login", { state: { from: location.pathname } })}
        />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <PermissionState
          title="没有管理员权限"
          description="当前账号不能访问运营审核后台。"
          actionLabel="返回首页"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[15rem_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{user.nickname}</p>
            <Badge variant="outline" className="mt-2 rounded-full">超级管理员</Badge>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "待审核", className: "bg-blue-100 text-blue-700" },
    verified: { label: "已通过", className: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "已驳回", className: "bg-red-100 text-red-700" },
    needs_changes: { label: "需补充", className: "bg-amber-100 text-amber-700" },
    none: { label: "未提交", className: "bg-muted text-muted-foreground" },
  };
  const item = map[status] ?? map.none;
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", item.className)}>{item.label}</span>;
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/70 p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
