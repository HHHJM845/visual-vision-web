import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissionsByAuthor } from "@/services/commissionService";
import { Commission } from "@/types/commission";

function statusLabel(c: Commission) {
  const now = new Date();
  const deadline = new Date(c.deadline);
  if (deadline < now) return { label: "已结束", class: "bg-muted text-muted-foreground" };
  if (c.applicants === 0) return { label: "招募中", class: "bg-blue-100 text-blue-700" };
  return { label: "进行中", class: "bg-yellow-100 text-yellow-700" };
}

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'client') { navigate('/dashboard/aigcer'); return null; }

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', 'author', user.id],
    queryFn: () => getCommissionsByAuthor(user.id),
  });

  const stats = {
    total: commissions.length,
    recruiting: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants === 0).length,
    ongoing: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants > 0).length,
    pending: 0,
  };

  const tagLabel = user.clientVerificationType === 'enterprise' ? '企业认证' :
    user.verificationStatus === 'verified' ? '实名认证' : '未认证';

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              <Badge className="text-xs">{tagLabel}</Badge>
            </div>
          </div>
          {user.verificationStatus === 'verified' ? (
            <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>+ 发布新项目</Button>
          ) : (
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/onboarding/client')}>
              完成认证以发布项目
            </Button>
          )}
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.total, label: "已发布" },
            { num: stats.recruiting, label: "招募中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.pending, label: "待验收" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 项目列表 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="all">
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {["all", "recruiting", "ongoing", "done"].map((v, i) => (
                <TabsTrigger key={v} value={v}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">
                  {["全部项目", "招募中", "进行中", "已完成"][i]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : commissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">还没有发布过项目</p>
                  {user.verificationStatus === 'verified' && (
                    <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>立即发布第一个项目</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map(c => {
                    const s = statusLabel(c);
                    return (
                      <div key={c.id} onClick={() => navigate(`/commissions/${c.id}`)}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.priceRange} · 截止 {c.deadline} · 应征 {c.applicants} 人</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.class}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="recruiting">
              <p className="text-center text-muted-foreground py-8 text-sm">招募中项目将在此显示</p>
            </TabsContent>
            <TabsContent value="ongoing">
              <p className="text-center text-muted-foreground py-8 text-sm">进行中项目将在此显示</p>
            </TabsContent>
            <TabsContent value="done">
              <p className="text-center text-muted-foreground py-8 text-sm">已完成项目将在此显示</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
