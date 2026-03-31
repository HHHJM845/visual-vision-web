import { useEffect, useRef, useState } from "react";

const artworks = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1611457194403-d3571b6a2924?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1541562232579-512a21360020?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1616627988170-851c46d63560?w=400&h=500&fit=crop",
];

const categories = ["商业宣传片", "短视频", "概念影像", "创意短片"];

const ITEM_WIDTH = 220;
const CENTER_WIDTH = 340;
const CENTER_HEIGHT = 420;
const SIDE_HEIGHT = 300;

const ArtworkCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-scroll
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % artworks.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Scroll thumbnails into view
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
      <div className="relative w-full overflow-hidden" style={{ height: CENTER_HEIGHT + 40 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          {artworks.map((url, i) => {
            const diff = i - activeIndex;
            const absDiff = Math.abs(diff);
            if (absDiff > 3) return null;

            const isCenter = absDiff === 0;
            const width = isCenter ? CENTER_WIDTH : ITEM_WIDTH - absDiff * 20;
            const height = isCenter ? CENTER_HEIGHT : SIDE_HEIGHT - absDiff * 20;
            const blur = isCenter ? 0 : absDiff * 2;
            const brightness = isCenter ? 1 : Math.max(0.5, 1 - absDiff * 0.2);
            const opacity = absDiff > 2 ? 0.3 : isCenter ? 1 : 0.75;
            const zIndex = 20 - absDiff;

            // Space images out from center: each slot is ITEM_WIDTH wide
            const translateX = diff * (ITEM_WIDTH + 10);

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
              <img src={url} alt="" className="w-12 h-12 object-cover" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtworkCarousel;
