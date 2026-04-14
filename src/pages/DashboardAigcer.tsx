import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { getApplicationsByAigcer, getCommissionById } from "@/services/commissionService";
import { Application } from "@/types/commission";
import { useEffect, useState } from "react";
import { Commission } from "@/types/commission";

interface AppWithCommission { app: Application; commission: Commission | null; }

export default function DashboardAigcer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appDetails, setAppDetails] = useState<AppWithCommission[]>([]);

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'aigcer') { navigate('/dashboard/client'); return null; }

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', 'aigcer', user.id],
    queryFn: () => getApplicationsByAigcer(user.id),
  });

  useEffect(() => {
    async function load() {
      const details = await Promise.all(
        applications.map(async app => ({ app, commission: await getCommissionById(app.commissionId) }))
      );
      setAppDetails(details);
    }
    load();
  }, [applications]);

  const stats = {
    applying: applications.filter(a => a.status === 'pending').length,
    ongoing: applications.filter(a => a.status === 'accepted').length,
    done: applications.filter(a => a.status === 'rejected').length,
    income: 0,
  };

  const milestones = ["开始合作", "概念稿", "分镜", "粗剪", "确认交付"];

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              {user.verificationStatus === 'verified' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-tag-verified text-primary-foreground">✓ 已认证</span>
              )}
            </div>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/commissions')}>
            去找项目 →
          </Button>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.applying, label: "应征中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.done, label: "已完成" },
            { num: `¥${stats.income}`, label: "累计收入" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="projects">
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {[["projects", "我的项目"], ["portfolio", "作品集"]].map(([v, l]) => (
                <TabsTrigger key={v} value={v}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="projects">
              {appDetails.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">还没有应征过项目</p>
                  <Button className="rounded-full" onClick={() => navigate('/commissions')}>去找项目</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appDetails.map(({ app, commission }) => (
                    <div key={app.id} className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80"
                      onClick={() => commission && navigate(`/commissions/${commission.id}`)}>
                      <p className="font-medium text-foreground text-sm mb-1">
                        {commission?.title ?? '未知项目'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {commission?.priceRange} · 截止 {commission?.deadline}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        app.status === 'accepted' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status === 'accepted' ? '进行中' : '已应征'}
                      </span>
                      {app.status === 'accepted' && (
                        <div className="mt-3">
                          <Progress value={20} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">{milestones[1]} 阶段</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio">
              {user.aigcerProfile?.portfolio?.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {user.aigcerProfile.portfolio.map(item => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-accent">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {user.verificationStatus === 'none' ? (
                    <Button className="rounded-full" onClick={() => navigate('/onboarding/aigcer')}>完成认证上传作品集</Button>
                  ) : '暂无作品'}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
