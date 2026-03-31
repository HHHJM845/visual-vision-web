import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "92vh",
        borderRadius: "0 0 50% 50% / 0 0 80px 80px",
      }}
    >
      <img
        src={heroBg}
        alt="AI影制"
        className="absolute inset-0 w-full h-full object-cover object-center"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* 内容垂直居中，整体偏下 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white"
        style={{ paddingTop: "20vh" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 drop-shadow-lg text-center leading-tight">
          找好承制方，完成需求，就这么简单！
        </h1>
        <p className="text-base md:text-lg opacity-90 mb-2 drop-shadow text-center">
          仅需3分钟发布需求，即可收到数十位AIGCer应征。
        </p>
        <p className="text-base md:text-lg opacity-90 mb-10 drop-shadow text-center">
          70000余位精选AIGCer在此等待，只为制作属于您的精彩AI影片。
        </p>
        <div className="flex gap-8">
          <Button
            size="lg"
            className="px-14 py-4 h-auto rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 shadow-xl"
          >
            我是需求方
          </Button>
          <Button
            size="lg"
            className="px-14 py-4 h-auto rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 shadow-xl"
          >
            我是创作者
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
