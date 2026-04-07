import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const videos = ["/hero-bg.mp4", "/hero-bg2.mp4"];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnded() {
    setCurrent((prev) => (prev + 1) % videos.length);
  }

  function goTo(index: number) {
    setCurrent(index);
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "92vh",
        borderRadius: "0 0 50% 50% / 0 0 80px 80px",
      }}
    >
      <video
        ref={videoRef}
        key={current}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src={videos[current]} type="video/mp4" />
      </video>
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

      {/* 轮播指示点 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
