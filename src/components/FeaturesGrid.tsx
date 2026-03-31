import { MessageCircle, ClipboardList, Shield, Building2 } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "简单便捷的沟通",
    lines: ["在线即时聊天，与AIGCer一对一沟通", "需求意向实时传达，提高合作效率"],
  },
  {
    icon: ClipboardList,
    title: "轻松高效的管理",
    lines: ["自定义影片验收阶段和详细报表", "轻松管理百位合作AIGCer"],
  },
  {
    icon: Shield,
    title: "可信赖的加密服务",
    lines: ["附件、需求、影片均可加密", "保证项目资料及信息不会泄露"],
  },
  {
    icon: Building2,
    title: "专业的企业服务",
    lines: ["还在困扰财务/合同/发票？", "专属商务经理将协助您解决！"],
  },
];

const FeaturesGrid = () => {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center">
                <f.icon className="w-9 h-9 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              {f.lines.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
