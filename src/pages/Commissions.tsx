import Navbar from "@/components/Navbar";
import CommissionCard from "@/components/CommissionCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockCommissions = [
  { title: "企业品牌AI宣传片制作", description: "需要制作一支60秒企业品牌宣传AI影片，风格现代简洁，突出科技感，需包含产品展示、公司文化...", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-29", category: "商业宣传片", applicants: 0, priceRange: "¥3k - 8k" },
  { title: "AI科幻短片制作（已有分镜）", description: "未来科幻风格短片，时长约3分钟，已有分镜脚本，需按照我方提供的参考风格进行AI影片生成与合成...", tag: "企业认证" as const, reputation: "信誉优良", deadline: "2026-04-30", category: "创意短片", applicants: 1, priceRange: "¥5k - 15k" },
  { title: "游戏宣传AI概念影像制作", description: "需要制作游戏上线宣传概念影像，时长30秒，风格奇幻史诗，需要AI生成角色动态与场景融合...", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-16", category: "概念影像", applicants: 1, priceRange: "¥2k - 6k" },
  { title: "虚拟主播AI形象短视频", description: "为虚拟主播制作AI形象宣传短视频，时长约15秒，需要Q版可爱风格，含动态效果...", tag: "企业认证" as const, reputation: "信誉优良", deadline: "2026-04-30", category: "短视频", applicants: 1, priceRange: "¥500 - 2k" },
  { title: "个人IP形象AI动态展示视频", description: "为个人原创IP制作AI动态展示视频，时长约20秒，需要配合已有形象设定进行AI生成...", tag: "未认证" as const, reputation: "信誉优良", deadline: "2026-04-29", category: "创意短片", applicants: 0, priceRange: "¥300 - 1k" },
  { title: "二次元风格AI宣传影片", description: "卡通日系厚涂风格AI影片，含角色动态、场景切换，用于产品发布会宣传展示...", tag: "未认证" as const, reputation: "信誉优良", deadline: "2027-03-01", category: "商业宣传片", applicants: 1, priceRange: "¥3k - 20k" },
  { title: "暗黑哥特风AI概念影像", description: "整体氛围暗黑哥特风格，AI生成二次元人偶与复古洛丽塔融合场景，低饱和冷色调，破碎感强烈...", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-15", category: "概念影像", applicants: 0, priceRange: "¥1k - 5k" },
  { title: "海洋主题AI短片制作", description: "以海天使为原型的海洋主题AI短片，配色以鲜艳蓝色为主，需融入海洋生物元素，时长约30秒...", tag: "实名认证" as const, reputation: "信誉优良", deadline: "2026-04-05", category: "创意短片", applicants: 1, priceRange: "¥500 - 2k" },
];

const Commissions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="commercial" className="mb-6">
          <TabsList className="bg-transparent gap-4 p-0">
            <TabsTrigger value="commercial" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">商业</TabsTrigger>
            <TabsTrigger value="personal" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">个人</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select><SelectTrigger className="w-32"><SelectValue placeholder="最新发布" /></SelectTrigger><SelectContent><SelectItem value="newest">最新发布</SelectItem><SelectItem value="ending">即将截止</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="类型与风格" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="commercial">商业宣传片</SelectItem><SelectItem value="short">创意短片</SelectItem><SelectItem value="concept">概念影像</SelectItem><SelectItem value="video">短视频</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="报酬区间不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="low">1k以下</SelectItem><SelectItem value="mid">1k-5k</SelectItem><SelectItem value="high">5k以上</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="交付日期不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="week">一周内</SelectItem><SelectItem value="month">一月内</SelectItem></SelectContent></Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockCommissions.map((c, i) => (
            <CommissionCard key={i} {...c} id={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Commissions;
