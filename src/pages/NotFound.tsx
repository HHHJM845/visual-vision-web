import { Link, useLocation } from "react-router-dom";
import { Home, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-var(--nav-height))] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary shadow-sm">
          <Search className="h-6 w-6" />
        </div>
        <p className="mb-2 text-sm font-medium text-primary">404</p>
        <h1 className="mb-2 text-2xl font-bold text-foreground">页面没有找到</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          你访问的路径「{location.pathname}」不存在，可能已下架或地址输入有误。
        </p>
        <Button asChild className="rounded-full">
          <Link to="/"><Home className="mr-2 h-4 w-4" />回到首页</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
