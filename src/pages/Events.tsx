import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";

const featuredEvent = {
  title: "AI影制 · 星际创作节",
  subtitle: "2025 冬日奇遇",
  date: "2024.12.23 - 2025.1.20",
  status: "已结束",
  bg: "from-indigo-900 via-purple-800 to-blue-900",
};

const events = [
  {
    title: "AI影制 · 星际创作节",
    date: "2024.8.7 - 2024.9.12",
    status: "已结束",
    bg: "from-indigo-800 to-purple-900",
    emoji: "🌌",
  },
  {
    title: "AIGC影片创作大赛 十二周年",
    date: "2021.8.2 - 2021.7.15",
    status: "已结束",
    bg: "from-blue-800 to-cyan-700",
    emoji: "🏆",
  },
  {
    title: "AIGC概念影像设计大赛",
    date: "2020.5.28 - 2020.7.15",
    status: "已结束",
    bg: "from-pink-800 to-rose-700",
    emoji: "🎨",
  },
  {
    title: "AI短片三周年创作大赛",
    date: "2019.10.9 - 2019.11.16",
    status: "已结束",
    bg: "from-orange-800 to-yellow-700",
    emoji: "🎬",
  },
  {
    title: "夏日AI影像创作大赛",
    date: "2019.4.29 - 2019.6.18",
    status: "已结束",
    bg: "from-teal-700 to-green-600",
    emoji: "☀️",
  },
  {
    title: "职场AI影像大作战2",
    date: "2019.3.7 - 2019.4.9",
    status: "已结束",
    bg: "from-blue-700 to-indigo-600",
    emoji: "💼",
  },
  {
    title: "职场AI影像大作战",
    date: "2018.5.13 - 2018.6.18",
    status: "已结束",
    bg: "from-slate-700 to-zinc-600",
    emoji: "🏙️",
  },
  {
    title: "数字创作者诞生时",
    date: "2017.12.20 - 2018.1.15",
    status: "已结束",
    bg: "from-amber-800 to-orange-700",
    emoji: "✨",
  },
  {
    title: "失去色彩的AI世界",
    date: "2017.5.12 - 2017.7.1",
    status: "已结束",
    bg: "from-gray-700 to-slate-600",
    emoji: "🌑",
  },
];

const Events = () => {
  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Featured banner */}
        <div className={`rounded-xl overflow-hidden mb-6 bg-gradient-to-br ${featuredEvent.bg} relative`}>
          <div className="h-64 flex flex-col items-center justify-center text-white p-8">
            <div className="text-5xl mb-3">🎬</div>
            <h1 className="text-3xl font-bold mb-1">{featuredEvent.subtitle}</h1>
            <p className="text-lg opacity-80">{featuredEvent.title}</p>
          </div>
        </div>

        {/* Featured title row */}
        <div className="flex items-center justify-between mb-8 bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-foreground">{featuredEvent.title}</span>
            <Badge variant="outline" className="text-xs text-muted-foreground">{featuredEvent.status}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">{featuredEvent.date}</span>
        </div>

        {/* Event grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`h-36 bg-gradient-to-br ${event.bg} flex items-center justify-center text-5xl`}>
                {event.emoji}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-card-foreground leading-snug">{event.title}</p>
                  <Badge variant="outline" className="text-xs text-muted-foreground flex-shrink-0">{event.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
