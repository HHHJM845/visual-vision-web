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

// Size per distance from center (16:9)
const SIZES = [
  { w: 560, h: 315 }, // diff=0  center
  { w: 370, h: 208 }, // diff=1
  { w: 260, h: 146 }, // diff=2
  { w: 190, h: 107 }, // diff=3
];
const GAP = 10;
const MAX_DIFF = 3;
const CONTAINER_H = SIZES[0].h + 80;

const OPACITY = [1, 0.82, 0.6, 0.35];

/** Compute pixel offset from center for a given diff value */
function getOffset(diff: number): number {
  if (diff === 0) return 0;
  const sign = diff > 0 ? 1 : -1;
  const abs = Math.abs(diff);
  let offset = SIZES[0].w / 2 + GAP + SIZES[1].w / 2; // diff=1 base
  for (let i = 2; i <= abs; i++) {
    offset += SIZES[i - 1].w / 2 + GAP + SIZES[i].w / 2;
  }
  return sign * offset;
}

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
    <section className="py-16 bg-background">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          万名AIGCer，涵盖各式风格的优选影片。
        </h2>
        <p className="text-sm text-muted-foreground">
          {categories.join(" / ")} /{" "}
          <span className="text-primary cursor-pointer">更多作品</span>
        </p>
      </div>

      {/* Carousel */}
      <div className="relative w-full overflow-hidden" style={{ height: CONTAINER_H }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {artworks.map((url, i) => {
            let diff = i - activeIndex;
            const n = artworks.length;
            if (diff > n / 2) diff -= n;
            if (diff < -n / 2) diff += n;
            const absDiff = Math.abs(diff);
            if (absDiff > MAX_DIFF) return null;

            const { w, h } = SIZES[absDiff];
            const translateX = getOffset(diff);
            const opacity = OPACITY[absDiff];
            const zIndex = 20 - absDiff;

            return (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className="absolute transition-all duration-500 cursor-pointer overflow-hidden rounded-xl"
                style={{
                  width: w,
                  height: h,
                  transform: `translateX(${translateX}px)`,
                  opacity,
                  zIndex,
                  boxShadow:
                    absDiff === 0
                      ? "0 16px 48px rgba(0,0,0,0.32)"
                      : "0 4px 12px rgba(0,0,0,0.12)",
                }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
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
