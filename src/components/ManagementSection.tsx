import { MessageSquare, Users, MessagesSquare } from "lucide-react";

const features = [
  { icon: Users, title: "海量AIGCer应征", desc: "可获得数十位AIGCer应征\n作品、信誉透明，供您全面评估\n轻松找到心仪AIGCer" },
  { icon: MessageSquare, title: "流畅合作管理", desc: "全流程在线管理\n从选定AIGCer到验收影片\n高效便捷" },
  { icon: MessagesSquare, title: "在线实时沟通", desc: "内置即时消息\n与AIGCer无障碍交流\n让创作更顺畅" },
];

const ManagementSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-16">
          简单易用的管理工具，帮您高效合作。
        </h2>
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
          {/* Left: mock screenshot */}
          <div className="flex-1 max-w-lg">
            <div className="bg-muted rounded-xl border border-border p-4 shadow-lg">
              <div className="bg-card rounded-lg p-3 mb-3 border border-border">
                <div className="flex gap-2 mb-2">
                  <div className="h-2 w-16 bg-primary/30 rounded" />
                  <div className="h-2 w-20 bg-primary rounded" />
                  <div className="h-2 w-14 bg-muted-foreground/20 rounded" />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-16 h-20 bg-accent rounded" />
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="flex gap-2 mb-2">
                  <div className="h-2 w-12 bg-muted-foreground/20 rounded" />
                  <div className="h-2 w-24 bg-primary/30 rounded" />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-16 h-20 bg-accent rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: feature list */}
          <div className="flex-1 space-y-10 max-w-sm">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManagementSection;
