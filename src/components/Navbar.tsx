import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "项目", path: "/commissions" },
  { label: "橱窗", path: "/showcase" },
  { label: "影片", path: "/gallery" },
  { label: "活动", path: "/events" },
  { label: "App", path: "/app" },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="h-[var(--nav-height)] flex items-center px-6 bg-background border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 mr-8">
        <span className="text-xl font-bold text-primary">🎬 AI影制</span>
        <span className="text-xs text-muted-foreground tracking-wider">VISIONAI.COM</span>
      </Link>
      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === item.path
                ? "text-primary"
                : "text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="sm">登录</Button>
        <Button size="sm">注册</Button>
      </div>
    </nav>
  );
};

export default Navbar;
