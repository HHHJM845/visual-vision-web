import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const categories = [
  { label: "全部类型", count: 999 },
  { label: "宣传片", count: 892 },
  { label: "短视频", count: 561 },
  { label: "概念影像", count: 311 },
  { label: "动态海报", count: 402 },
  { label: "创意短片", count: 178 },
  { label: "真人合成", count: 350 },
  { label: "AI动画", count: 165 },
  { label: "数字人", count: 381 },
  { label: "特效合成", count: 186 },
];

const fastDelivery = [
  { title: "【企业】品牌AI宣传片or纪录片...", tag: "24H", sold: 8, price: 180, author: "云雾视觉机", avatar: "🎬" },
  { title: "火速半分钟短视频", tag: "24H", sold: 7, price: 168, author: "像野骑好好玩", avatar: "⚡" },
  { title: "【24h】打包两条宣传头", tag: "24H", sold: 139, price: 99, author: "鹰野鹳九", avatar: "🦅" },
  { title: "24H关键片段 AI合成", tag: "24H", sold: 6, price: 222, author: "水润面包", avatar: "💧" },
  { title: "cc的一片活", tag: "24H", sold: 224, price: 59, author: "从心所通", avatar: "✨" },
];

const recommended = [
  { title: "<4月限期>单人证件影像", tag: null, sold: 78, price: 168, author: "执期视角", avatar: "🎥" },
  { title: "特价赠品小零食短片", tag: null, sold: 37, price: 66, author: "鱼鱼", avatar: "🐟" },
  { title: "【24h】打包两条宣传片", tag: "24H", sold: 139, price: 99, author: "鹰野鹳九", avatar: "🦅" },
  { title: "【特价】水墨风AI影像", tag: "特价", sold: 92, price: 126, author: "久生1111", avatar: "🖌️" },
  { title: "概念影像定制", tag: null, sold: 44, price: 52, author: "他里啦啦噜666", avatar: "🌌" },
];

const newest = [
  { title: "大头·AI个人形象短片", tag: null, sold: null, price: 85, author: "teano", avatar: "👤" },
  { title: "【试投】一套数字人止太头", tag: "试投", sold: null, price: 136, author: "シ ョタ欲しい", avatar: "🤖" },
  { title: "【48H】证件影·收入", tag: "48H", sold: 23, price: 125, author: "松松松松力", avatar: "📋" },
  { title: "一键换装AI影像", tag: null, sold: 1, price: 189, author: "物兔楚楚", avatar: "👗" },
  { title: "全身AI写实渲染", tag: null, sold: 14, price: 120, author: "meemor", avatar: "🎭" },
];

const upcoming = [
  { title: "AI概念影像·机甲", tag: "24H", sold: null, price: null, author: "铁甲战神", avatar: "🤖" },
  { title: "动态光效特效短片", tag: "24H", sold: null, price: null, author: "光影师", avatar: "💡" },
  { title: "虚拟偶像宣传MV", tag: null, sold: null, price: null, author: "星际创作", avatar: "⭐" },
  { title: "AI写实人物短片", tag: null, sold: null, price: null, author: "真实影像", avatar: "📸" },
];

const ShowcaseCard = ({ item }: { item: typeof fastDelivery[0] }) => (
  <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow cursor-pointer">
    <div className="relative aspect-[4/3] bg-accent flex items-center justify-center text-4xl">
      {item.avatar}
      {item.tag && (
        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
          {item.tag}
        </span>
      )}
      {item.sold != null && (
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
          已售 {item.sold}
        </span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm font-medium text-card-foreground truncate mb-2">{item.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-xs">{item.avatar}</span>
          {item.author}
        </div>
        <span className="text-base font-bold text-price">¥{item.price}</span>
      </div>
    </div>
  </div>
);

const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    <button className="text-sm text-primary hover:underline">查看更多 &gt;</button>
  </div>
);

const Showcase = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border">
          {categories.map((cat, i) => (
            <button
              key={cat.label}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-foreground hover:bg-primary/10"
              }`}
            >
              {cat.label}
              <span className={`text-xs ${i === 0 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* 快速交付 */}
        <section className="mb-10">
          <SectionHeader title="快速交付" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {fastDelivery.map((item, i) => (
              <ShowcaseCard key={i} item={item} />
            ))}
          </div>
        </section>

        {/* 好推荐 */}
        <section className="mb-10">
          <SectionHeader title="好推荐" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recommended.map((item, i) => (
              <ShowcaseCard key={i} item={item} />
            ))}
          </div>
        </section>

        {/* 最新上架 */}
        <section className="mb-10">
          <SectionHeader title="最新上架" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {newest.map((item, i) => (
              <ShowcaseCard key={i} item={item} />
            ))}
          </div>
        </section>

        {/* 即将上架 */}
        <section className="mb-10">
          <SectionHeader title="即将上架" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {upcoming.map((item, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden border border-border border-dashed opacity-70">
                <div className="aspect-[4/3] bg-accent/50 flex items-center justify-center text-4xl">
                  {item.avatar}
                  {item.tag && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-card-foreground truncate mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Showcase;
