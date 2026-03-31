import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Share2, ChevronLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockCommissions = [
  { id: 0, title: "企业品牌AI宣传片制作", description: "需要制作一支60秒企业品牌宣传AI影片，风格现代简洁，突出科技感，需包含产品展示、公司文化等内容。", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-29", category: "商业宣传片", applicants: 0, priceRange: "¥3k ~ 8k", author: "柚柚酒", rating: 5, reviews: 17, completionRate: "17 / 17", handlingFee: "5%", type: "商业用途" },
  { id: 1, title: "AI科幻短片制作（已有分镜）", description: "未来科幻风格短片，时长约3分钟，已有分镜脚本，需按照我方提供的参考风格进行AI影片生成与合成。", tag: "企业认证" as const, reputation: "信誉优良", deadline: "2026-04-30", category: "创意短片", applicants: 1, priceRange: "¥5k ~ 15k", author: "画境工作室", rating: 5, reviews: 32, completionRate: "30 / 32", handlingFee: "5%", type: "商业用途" },
  { id: 2, title: "游戏宣传AI概念影像制作", description: "需要制作游戏上线宣传概念影像，时长30秒，风格奇幻史诗，需要AI生成角色动态与场景融合。", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-16", category: "概念影像", applicants: 1, priceRange: "¥2k ~ 6k", author: "星辰", rating: 4, reviews: 8, completionRate: "7 / 8", handlingFee: "5%", type: "商业用途" },
  { id: 3, title: "虚拟主播AI形象短视频", description: "为虚拟主播制作AI形象宣传短视频，时长约15秒，需要Q版可爱风格，含动态效果。", tag: "企业认证" as const, reputation: "信誉优良", deadline: "2026-04-30", category: "短视频", applicants: 1, priceRange: "¥500 ~ 2k", author: "V社工作室", rating: 5, reviews: 15, completionRate: "14 / 15", handlingFee: "5%", type: "商业用途" },
  { id: 4, title: "个人IP形象AI动态展示视频", description: "为个人原创IP制作AI动态展示视频，时长约20秒，需要配合已有形象设定进行AI生成。", tag: "未认证" as const, reputation: "信誉优良", deadline: "2026-04-29", category: "创意短片", applicants: 0, priceRange: "¥300 ~ 1k", author: "小鱼", rating: 3, reviews: 2, completionRate: "2 / 2", handlingFee: "5%", type: "个人用途" },
  { id: 5, title: "二次元风格AI宣传影片", description: "卡通日系厚涂风格AI影片，含角色动态、场景切换，用于产品发布会宣传展示。", tag: "未认证" as const, reputation: "信誉优良", deadline: "2027-03-01", category: "商业宣传片", applicants: 1, priceRange: "¥3k ~ 20k", author: "梦想家", rating: 4, reviews: 5, completionRate: "4 / 5", handlingFee: "5%", type: "商业用途" },
  { id: 6, title: "暗黑哥特风AI概念影像", description: "整体氛围暗黑哥特风格，AI生成二次元人偶与复古洛丽塔融合场景，低饱和冷色调，破碎感强烈。", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-15", category: "概念影像", applicants: 0, priceRange: "¥1k ~ 5k", author: "暗夜蔷薇", rating: 5, reviews: 12, completionRate: "11 / 12", handlingFee: "5%", type: "个人用途" },
  { id: 7, title: "海洋主题AI短片制作", description: "以海天使为原型的海洋主题AI短片，配色以鲜艳蓝色为主，需融入海洋生物元素，时长约30秒。", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-05", category: "创意短片", applicants: 1, priceRange: "¥500 ~ 2k", author: "海天使", rating: 4, reviews: 6, completionRate: "5 / 6", handlingFee: "5%", type: "个人用途" },
];

const milestones = [
  { label: "开始合作", percent: 0 },
  { label: "概念稿", percent: 20 },
  { label: "分镜", percent: 40 },
  { label: "粗剪", percent: 70 },
  { label: "确认交付", percent: 100 },
];

const CommissionDetail = () => {
  const { id } = useParams();
  const commission = mockCommissions[Number(id)] || mockCommissions[0];

  const daysLeft = Math.max(0, Math.ceil((new Date(commission.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left sidebar - user info */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-card rounded-lg border border-border p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-accent mx-auto mb-3 flex items-center justify-center text-3xl">
                🎬
              </div>
              <h3 className="font-semibold text-card-foreground mb-2">{commission.author}</h3>
              <div className="flex items-center justify-center gap-0.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < commission.rating ? "text-secondary fill-secondary" : "text-muted-foreground"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-3">共 {commission.reviews} 条评价</p>
              <div className="flex items-center justify-center gap-1 text-xs text-primary mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>已完成身份证实名认证</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">需求完成率 {commission.completionRate}</p>
              <Badge variant="outline" className="text-xs">极高</Badge>
            </div>

            <div className="bg-card rounded-lg border border-border p-5 mt-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">交付日期</p>
                <p className="text-lg font-bold text-primary">{commission.deadline}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">项目报酬预算</p>
                <p className="text-lg font-bold text-price">{commission.priceRange}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">手续费率 ⓘ</p>
                <p className="text-lg font-bold text-primary">{commission.handlingFee}</p>
              </div>
              <p className="text-xs text-muted-foreground">{daysLeft} 天后关闭项目</p>
              <Button className="w-full rounded-full text-base" size="lg">
                🎬 应征项目
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <Share2 className="w-3.5 h-3.5" />分享项目
              </button>
              <Link to="/commissions" className="flex items-center gap-1 hover:text-primary transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />返回列表
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-card-foreground">{commission.title}</h1>
                <Badge variant="outline" className="text-destructive border-destructive text-xs flex-shrink-0">🔴 审核项目</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
                <span>发布于 {commission.deadline}</span>
                <span>◎ {commission.type}</span>
                <span>◇ {commission.category}</span>
              </div>

              {/* Flow diagram */}
              <div className="bg-accent/50 rounded-lg p-6 mb-6">
                <h3 className="text-center font-bold text-primary mb-4">AI影制承制流程示意图</h3>
                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-xs text-center font-medium text-primary mb-2 bg-primary/10 rounded-full py-1 mx-auto w-16">需求方</p>
                    <div className="flex items-center justify-around text-xs text-muted-foreground">
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">📋</div>发布需求</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">💬</div>沟通报酬及细节</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">👥</div>选定AIGCer</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">💰</div>支付保证金</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-around text-xs text-muted-foreground">
                    <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">📬</div>验收影片</div>
                    <span>→</span>
                    <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">✅</div>确认交付</div>
                  </div>
                  <div>
                    <p className="text-xs text-center font-medium text-secondary mb-2 bg-secondary/10 rounded-full py-1 mx-auto w-16">AIGCer</p>
                    <div className="flex items-center justify-around text-xs text-muted-foreground">
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">🔍</div>应征项目</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">👥</div>接受项目</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">🎬</div>创作影片</div>
                      <span>→</span>
                      <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">💵</div>获得报酬</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <div className="text-center"><div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center mb-1 mx-auto">👍</div>评价</div>
                  </div>
                </div>
              </div>

              {/* Requirement details */}
              <h2 className="text-lg font-bold text-primary mb-3">需求详情</h2>
              <p className="text-sm text-foreground mb-6">{commission.description}</p>

              <h2 className="text-lg font-bold text-primary mb-3">影片要求</h2>
              <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                <div className="flex gap-2"><span className="text-muted-foreground">🎬 影片风格：</span><span>风格不限</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">📐 分辨率规格：</span><span>需与AIGCer商议</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">🎨 色彩模式：</span><span>RGB</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">📁 影片格式：</span><span>MP4，MOV</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">📢 发布权限：</span><span>需按约定公开发布</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">🔄 反馈间隔：</span><span>不需要定期反馈</span></div>
                <div className="flex gap-2"><span className="text-muted-foreground">✏️ 概念稿要求：</span><span>需提交概念稿审核</span></div>
              </div>

              {/* Process flow */}
              <h2 className="text-lg font-bold text-primary mb-3">项目流程</h2>
              <div className="bg-accent/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-secondary">需求方选定合作AIGCer后，将按照下方流程支付保证金到平台进行托管。</p>
                <p className="text-sm text-secondary">AIGCer确认保证金支付后，按照对应节点提交进度影片，供需求方审核。</p>
              </div>

              {/* Milestone progress */}
              <div className="relative mt-8 mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  {milestones.map((m) => (
                    <span key={m.label} className="text-center">{m.label}</span>
                  ))}
                </div>
                <div className="relative h-2 bg-border rounded-full">
                  <div className="absolute inset-y-0 left-0 bg-primary rounded-full" style={{ width: "0%" }} />
                  {milestones.map((m) => (
                    <div
                      key={m.label}
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-primary-foreground"
                      style={{ left: `${m.percent}%`, transform: `translate(-50%, -50%)` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  {milestones.map((m) => (
                    <span key={m.label}>{m.percent}%</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Applicant list */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-card-foreground">应征AIGCer列表</h2>
                <div className="flex gap-4 text-xs">
                  <span className="text-primary cursor-pointer">本项目共应征AIGCer {commission.applicants} 名</span>
                  <span className="text-primary cursor-pointer">需求方选定 0 名</span>
                </div>
              </div>
              {commission.applicants === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无AIGCer应征，快来成为第一位！</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">已有 {commission.applicants} 位AIGCer应征</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CommissionDetail;
