const testimonials = [
  {
    company: "西山居",
    companyEn: "SEASUN ENTERTAINMENT",
    person: "西山居 项目负责人",
    dept: "3蓝诺3",
    logoColor: "#e8363d",
    text: "页面设计很直观，AIGCer风格鲜明，项目面板的流程清晰，承制很方便。网站客服热心。\n\nAIGCer和需求方都可以有更多收益、体感很NICE，期待更多合作。",
  },
  {
    company: "RASTAR",
    companyEn: "星辉游戏",
    person: "星辉天拓 项目负责人",
    dept: "EARVA",
    logoColor: "#e8363d",
    text: "AIGCer众多，找创作者也方便，基本上各种风格的AI影片都能在这里找到合适的人。\n\n项目流程清晰，有问题也能马上反馈，希望合作能越来越多，帮助项目越做越好！",
  },
  {
    company: "网易游戏",
    companyEn: "NetEase Games",
    person: "网易 倩女幽魂项目组",
    dept: "网易（杭州）",
    logoColor: "#c0252c",
    text: "专业的平台、优质的服务，AIGCer资源十分丰富，风格多样。\n\n承制流程清晰明确，操作方便。期待以后有更深入的合作！",
  },
  {
    company: "完美世界游戏",
    companyEn: "PERFECT WORLD GAMES",
    person: "完美世界 梦间集研发组",
    dept: "OuYang",
    logoColor: "#f59e0b",
    text: "平台AIGCer质量有品控保障，使用方便还可在平台上\u201C货比三家\u201D，省去寻找创作者的麻烦。\n\n帮助企业AIGC影片外包流程，完工速度快。米画师平台已成为我们长期合作的优质供应商。",
  },
  {
    company: "中手游",
    companyEn: "CMGE · 中手游",
    person: "中手游 项目负责人",
    dept: "绾而复始",
    logoColor: "#f59e0b",
    text: "平台通过自身的专业能力，降低了合作项目与AIGCer的沟通成本。\n\n并且资源储备丰富，各种风格需求，都能够快速地找到合适的AI影片创作者，有效减少了沟通时间，非常赞！",
  },
  {
    company: "网易互动娱乐",
    companyEn: "NetEase Interactive",
    person: "香港网易互动娱乐",
    dept: "啊树",
    logoColor: "#f97316",
    text: "AI影制提供了一个对双方都好的平台，给双方提供了更多的利益，减少了需求方和AIGCer之间的相互猜疑，可以更好更放心地去完成工作。目前我们正在密切合作中~",
  },
];

const LogoPlaceholder = ({ company, companyEn, color }: { company: string; companyEn: string; color: string }) => (
  <div className="h-16 flex items-center mb-4">
    <div
      className="flex flex-col leading-tight"
      style={{ color }}
    >
      <span className="text-xl font-black tracking-tight">{company}</span>
      <span className="text-[10px] font-medium tracking-widest opacity-70 uppercase">{companyEn}</span>
    </div>
  </div>
);

const TestimonialsSection = () => {
  return (
    <section className="py-20" style={{ background: "#eef1f8" }}>
      <div className="max-w-5xl mx-auto px-4 text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          使用过AI影制的人怎么说？
        </h2>
        <p className="text-sm text-muted-foreground">
          发现并敢于尝试一个新事物确实非常困难，
          <br />
          您可以先看看我们的用户怎么说。
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div
            key={t.person}
            className="bg-white rounded-xl p-6 text-left shadow-sm"
          >
            {/* 大引号 */}
            <div
              className="text-5xl font-serif leading-none mb-3 select-none"
              style={{ color: "#a8c4e0", fontFamily: "Georgia, serif" }}
            >
              "
            </div>

            {/* Logo */}
            <LogoPlaceholder company={t.company} companyEn={t.companyEn} color={t.logoColor} />

            {/* 分隔线 */}
            <div className="border-t border-gray-100 mb-4" />

            {/* 职位 & 姓名 */}
            <h4 className="font-bold text-foreground text-sm mb-0.5">{t.person}</h4>
            <p className="text-xs text-muted-foreground mb-4">{t.dept}</p>

            {/* 评价文字 */}
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {t.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
