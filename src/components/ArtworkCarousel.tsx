import { useEffect, useRef, useState } from "react";

const artworks = [
  "/artworks/1.png",
  "/artworks/2.png",
  "/artworks/3.png",
  "/artworks/4.png",
  "/artworks/5.png",
  "/artworks/6.png",
  "/artworks/7.png",
  "/artworks/8.png",
  "/artworks/9.png",
  "/artworks/10.png",
  "/artworks/11.png",
  "/artworks/12.png",
];

const categories = ["商业宣传片", "短视频", "概念影像", "创意短片"];

// 16:9 dimensions
const CENTER_WIDTH = 560;
const CENTER_HEIGHT = Math.round(CENTER_WIDTH * 9 / 16); // 315
const SIDE_WIDTH = 260;
const SIDE_STEP = 30; // width reduction per level
const SLOT = 190; // horizontal spacing — smaller = more overlap

const ArtworkCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % artworks.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    const el = container?.children[activeIndex] as HTMLElement;
    if (el && container) {
      const scrollLeft =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeIndex]);

  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          万名AIGCer，涵盖各式风格的优选影片。
        </h2>
        <p className="text-sm text-muted-foreground">
          {categories.join(" / ")} /{" "}
          <span className="text-primary cursor-pointer">更多作品</span>
        </p>
      </div>

      {/* Main carousel */}
      <div className="relative w-full overflow-hidden" style={{ height: CENTER_HEIGHT + 60 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {artworks.map((url, i) => {
            let diff = i - activeIndex;
            const n = artworks.length;
            if (diff > n / 2) diff -= n;
            if (diff < -n / 2) diff += n;
            const absDiff = Math.abs(diff);
            if (absDiff > 3) return null;

            const isCenter = absDiff === 0;
            const width = isCenter ? CENTER_WIDTH : Math.max(SIDE_WIDTH - (absDiff - 1) * SIDE_STEP, 100);
            const height = Math.round(width * 9 / 16);
            const blur = isCenter ? 0 : absDiff * 2;
            const brightness = isCenter ? 1 : Math.max(0.5, 1 - absDiff * 0.2);
            const opacity = absDiff > 2 ? 0.3 : isCenter ? 1 : 0.75;
            const zIndex = 20 - absDiff;
            const translateX = diff * SLOT;

            return (
              <div
                key={i}
                className="absolute transition-all duration-500 cursor-pointer overflow-hidden rounded-lg"
                style={{
                  width,
                  height,
                  transform: `translateX(${translateX}px)`,
                  zIndex,
                  opacity,
                  filter: `blur(${blur}px) brightness(${brightness})`,
                  boxShadow: isCenter ? "0 8px 40px rgba(0,0,0,0.35)" : "none",
                }}
                onClick={() => setActiveIndex(i)}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto py-2 justify-center"
          style={{ scrollbarWidth: "none" }}
        >
          {artworks.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`flex-shrink-0 rounded overflow-hidden border-2 transition-all duration-200 ${
                i === activeIndex
                  ? "border-primary scale-110"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <img src={url} alt="" className="w-16 h-9 object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtworkCarousel;
