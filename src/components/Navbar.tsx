import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "项目", path: "/commissions" },
  { label: "橱窗", path: "/showcase" },
  { label: "影片", path: "/gallery" },
  { label: "活动", path: "/events" },
  { label: "App", path: "/app" },
];

const verificationLabel: Record<string, string> = {
  none: "未认证",
  pending: "审核中",
  verified: "已认证",
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashboardPath = user?.role === 'client' ? '/dashboard/client' : '/dashboard/aigcer';

  return (
    <nav className="h-[var(--nav-height)] flex items-center px-6 bg-background border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 mr-8">
        <img src="/logo.png" alt="跃然承制" className="w-8 h-8 object-contain" />
        <span className="text-xl font-bold text-primary">跃然承制</span>
        <span className="text-xs text-muted-foreground tracking-wider">VISIONAI.COM</span>
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
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {user.nickname.charAt(0)}
                </div>
                <span className="text-sm text-foreground hidden sm:inline">{user.nickname}</span>
                {user.verificationStatus === 'verified' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-tag-enterprise text-primary-foreground">
                    {user.clientVerificationType === 'enterprise' ? '企业认证' :
                     user.role === 'client' ? '实名认证' : '已认证'}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                我的工作台
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { logout(); navigate('/'); }}
                className="text-destructive"
              >
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>登录</Button>
            <Button size="sm" onClick={() => navigate('/register')}>注册</Button>
          </>
        )}
      </div>
    </nav>
  );
}
