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

const CARD_W = 380;
const CARD_H = Math.round(CARD_W * 9 / 16); // 214px — 16:9
const GAP = 10;

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

  // Keep thumbnail strip centered on active item
  useEffect(() => {
    const container = scrollRef.current;
    const el = container?.children[activeIndex] as HTMLElement;
    if (el && container) {
      const scrollLeft =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeIndex]);

  // translateX so active card sits at the horizontal center of the viewport
  const trackOffset = `calc(50% - ${activeIndex * (CARD_W + GAP) + CARD_W / 2}px)`;

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

      {/* Full-width sliding strip */}
      <div
        className="w-full overflow-hidden"
        style={{ height: CARD_H + 40 }}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out items-center"
          style={{
            gap: GAP,
            transform: `translateX(${trackOffset})`,
            height: CARD_H + 40,
          }}
        >
          {artworks.map((url, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={i}
                onClick={() => setActiveIndex(i)}
                className="flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-500"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  transform: isActive ? "scale(1.07)" : "scale(1)",
                  opacity: isActive ? 1 : 0.65,
                  boxShadow: isActive
                    ? "0 12px 40px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.08)",
                  zIndex: isActive ? 10 : 1,
                  position: "relative",
                }}
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
