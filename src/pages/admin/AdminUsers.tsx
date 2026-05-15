import { AdminShell, StatusBadge } from "@/components/AdminChrome";
import { Badge } from "@/components/ui/badge";
import { listAdminUsers } from "@/services/adminService";

export default function AdminUsers() {
  const users = listAdminUsers();

  return (
    <AdminShell title="用户列表" description="查看平台用户、角色、认证状态和完整联系方式。">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground">
          <span>用户</span>
          <span>角色</span>
          <span>状态</span>
          <span>手机号</span>
          <span>注册时间</span>
        </div>
        {users.map((user) => (
          <div key={user.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0">
            <div>
              <p className="font-medium text-foreground">{user.nickname}</p>
              <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <Badge variant="outline" className="rounded-full">
                {user.role === "admin" ? "管理员" : user.role === "client" ? "需求方" : "AIGCer"}
              </Badge>
            </div>
            <StatusBadge status={user.verificationStatus} />
            <span className="text-muted-foreground">{user.phone || "未填写"}</span>
            <span className="text-muted-foreground">{user.createdAt}</span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
