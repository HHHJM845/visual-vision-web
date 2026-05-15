const testimonials = [
  {
    company: "B站",
    companyEn: "BILIBILI",
    person: "B站 2026年第一季度财报项目组",
    dept: "2026年第一季度财报",
    logoColor: "#00A1D6",
    text: "项目资料梳理清晰，AIGCer能快速理解财报信息可视化和传播需求，交付沟通很顺畅。\n\n从数据重点、视觉风格到版本反馈都有明确流程，帮助我们高效完成2026年第一季度财报内容呈现。",
  },
  {
    company: "TCL",
    companyEn: "TCL 电视",
    person: "TCL电视 项目负责人",
    dept: "TCL",
    logoColor: "#e8363d",
    text: "AI三维动画制作的电视广告效果动人，画面温馨真挚，很好地呈现了品牌想传达的家庭陪伴感。\n\n创作沟通顺畅，制作节奏清晰，细节反馈也能快速落地，整体合作体验很安心。",
  },
  {
    company: "网易游戏",
    companyEn: "NetEase Games",
    person: "网易 阴阳师项目组",
    dept: "网易（杭州）",
    logoColor: "#c0252c",
    text: "专业的平台、优质的服务，AIGCer资源十分丰富，风格多样。\n\n承制流程清晰明确，操作方便。期待以后有更深入的合作！",
  },
  {
    company: "机甲战队",
    companyEn: "MECHA SQUAD",
    person: "机甲战队漫剧 项目组",
    dept: "宣发PV与前期设定",
    logoColor: "#f59e0b",
    text: "宣发PV的节奏和视觉冲击力都很到位，机甲战斗氛围鲜明，能快速把项目调性传达出来。\n\n前期也协助完成了漫剧的背景设定、世界观氛围和角色方向梳理，让后续内容制作更顺畅。",
  },
  {
    company: "统一",
    companyEn: "UNI-PRESIDENT",
    person: "统一柠檬茶 视频项目组",
    dept: "统一柠檬茶",
    logoColor: "#f59e0b",
    text: "AI视频把柠檬茶的清爽感和年轻化氛围呈现得很自然，画面明亮有记忆点，适合新品传播和社媒投放。\n\n从风格提案到成片交付，每个节点沟通都很清晰，反馈修改响应快，整体合作效率很高。",
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
