import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { assetUrl } from "@/lib/assets";
import { User } from "@/types/user";

const navItems = [
  { label: "项目", path: "/commissions" },
  { label: "创作者", path: "/creators" },
  { label: "橱窗", path: "/showcase" },
  { label: "影片", path: "/gallery" },
  { label: "活动", path: "/events" },
  { label: "消息", path: "/messages" },
  { label: "App", path: "/app" },
];

function roleBadge(user: User) {
  if (user.role === "admin") return "管理员";
  if (user.verificationStatus === "pending") return "审核中";
  if (user.verificationStatus === "rejected") return "已驳回";
  if (user.verificationStatus === "needs_changes") return "需补充";
  if (user.verificationStatus !== "verified") return null;
  if (user.clientVerificationType === "enterprise") return "企业认证";
  return user.role === "client" ? "实名认证" : "已认证";
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const badge = user ? roleBadge(user) : null;

  return (
    <nav className="sticky top-0 z-50 flex h-[var(--nav-height)] items-center border-b border-border bg-background px-6">
      <Link to="/" className="mr-8 flex items-center gap-2">
        <img src={assetUrl("logo.webp")} alt="跃然承制" className="h-8 w-8 object-contain" />
        <span className="text-xl font-bold text-primary">跃然承制</span>
        <span className="text-xs tracking-wider text-muted-foreground">VISIONAI.COM</span>
      </Link>

      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === item.path ? "text-primary" : "text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {user.nickname.charAt(0)}
                </div>
                <span className="hidden text-sm text-foreground sm:inline">{user.nickname}</span>
                {badge && (
                  <span className="rounded-full bg-tag-enterprise px-2 py-0.5 text-xs text-primary-foreground">
                    {badge}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user.role === "admin" ? (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  管理员后台
                </DropdownMenuItem>
              ) : user.role === "client" ? (
                <DropdownMenuItem onClick={() => navigate("/dashboard/client")}>
                  需求方工作台
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/dashboard/aigcer")}>
                  创作者工作台
                </DropdownMenuItem>
              )}
              {user.role !== "admin" && (
                <DropdownMenuItem onClick={() => navigate(user.role === "client" ? "/commissions/new" : "/commissions")}>
                  {user.role === "client" ? "发布新项目" : "去找项目"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => { logout(); navigate("/"); }}
                className="text-destructive"
              >
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>登录</Button>
            <Button size="sm" onClick={() => navigate("/register")}>注册</Button>
          </>
        )}
      </div>
    </nav>
  );
}
