import { BarChart3, CheckCircle2, Download, Monitor, QrCode, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { PageShell, SectionTitle } from "@/components/PageChrome";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const features = [
  { title: "项目进度随时看", desc: "从应征、选定到节点验收，关键状态集中呈现。", icon: BarChart3 },
  { title: "沟通与资料更清楚", desc: "需求、报价、参考图和交付物都围绕项目组织。", icon: Sparkles },
  { title: "交易托管更安心", desc: "节点确认、保证金托管和交付记录保持可追溯。", icon: ShieldCheck },
];

const screenCards = [
  { title: "项目广场", desc: "筛选预算、周期和风格", icon: Smartphone },
  { title: "创作工作台", desc: "查看应征与交付节点", icon: BarChart3 },
  { title: "橱窗服务", desc: "收藏常用承制服务", icon: CheckCircle2 },
];

const AppPage = () => {
  const { toast } = useToast();
  const handleDownload = (platform: string) => {
    toast({ title: `${platform}下载已开始`, description: "当前为演示包，正式上线后会跳转到对应应用市场。" });
  };

  return (
    <PageShell>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="grid gap-10 rounded-3xl border border-border bg-card p-6 shadow-sm md:grid-cols-[0.95fr_1.05fr] md:p-10">
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">VisionAI App</p>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-6xl">
              把承制流程装进一个更轻的工作台
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
              面向需求方和 AIGCer 的协作入口：找项目、看作品、收消息、管节点，用更少切换完成更多协作。
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <QrCode className="h-16 w-16 text-foreground" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="rounded-full" onClick={() => handleDownload("iOS 版")}>
                  <Download className="mr-2 h-4 w-4" /> iOS 版
                </Button>
                <Button className="rounded-full" onClick={() => handleDownload("安卓版")}>
                  <Download className="mr-2 h-4 w-4" /> 安卓版
                </Button>
                <Button variant="outline" className="rounded-full sm:col-span-2" onClick={() => handleDownload("桌面版")}>
                  <Monitor className="mr-2 h-4 w-4" /> 桌面版下载
                </Button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.20),transparent_18rem),hsl(var(--muted))] p-6">
            <div className="absolute left-8 top-8 rounded-full bg-background/85 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              4.8 / 5 用户评分
            </div>
            <div className="mx-auto mt-16 w-64 rounded-[2rem] border-8 border-foreground bg-background p-3 shadow-2xl">
              <div className="mb-4 h-5 rounded-full bg-foreground" />
              <div className="space-y-3">
                <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                  <p className="text-xs opacity-80">今日待处理</p>
                  <p className="mt-2 text-2xl font-bold">12</p>
                </div>
                {screenCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="absolute bottom-8 right-8 rounded-2xl border border-border bg-background/90 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-foreground">节点验收</p>
              <div className="mt-3 h-2 w-36 rounded-full bg-muted">
                <div className="h-2 w-2/3 rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">粗剪阶段 · 70%</p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <SectionTitle title="更适合移动协作的三个细节" description="不是把网页塞进手机，而是让高频动作更靠前。" />
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
};

export default AppPage;
