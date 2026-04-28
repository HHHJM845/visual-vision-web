import { useMemo, useState } from "react";
import { Aperture, Film, Heart, Search, Sparkles, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import GalleryCard from "@/components/GalleryCard";
import { FilterChip, PageHero, PageShell } from "@/components/PageChrome";
import { SearchEmptyState } from "@/components/StateViews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { galleryItems } from "@/data/mockData";

const categories = ["全部", "商业宣传片", "创意短片", "概念影像", "短视频"];
const styles = ["全部", "二次元风", "国风古典", "欧美写实"];
const techniques = ["全部", "AI绘图生成", "AI动效合成", "AI真人合成", "AI写实渲染"];

const Gallery = () => {
  const [ranking, setRanking] = useState("newest");
  const [category, setCategory] = useState("全部");
  const [style, setStyle] = useState("全部");
  const [technique, setTechnique] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<(typeof galleryItems)[number] | null>(null);

  const visibleItems = useMemo(() => {
    return galleryItems
      .filter((item) => category === "全部" || item.category === category)
      .filter((item) => style === "全部" || item.style === style)
      .filter((item) => technique === "全部" || item.technique === technique)
      .filter((item) => !keyword.trim() || `${item.title} ${item.author}`.toLowerCase().includes(keyword.trim().toLowerCase()))
      .sort((a, b) => ranking === "weekly" ? b.likes - a.likes : a.id.localeCompare(b.id));
  }, [category, keyword, ranking, style, technique]);

  function resetFilters() {
    setCategory("全部");
    setStyle("全部");
    setTechnique("全部");
    setKeyword("");
  }

  function FilterGroup({ title, value, items, onChange }: { title: string; value: string; items: string[]; onChange: (value: string) => void }) {
    return (
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <FilterChip key={item} active={value === item} onClick={() => onChange(item)}>
              {item}
            </FilterChip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <Navbar />
      <PageHero
        eyebrow="Film Gallery"
        title="用作品判断风格，而不是只看介绍"
        description="影片灵感库聚合不同类别、风格和制作方式，适合用来找参考、看趋势，也可以快速定位创作者方向。"
        stats={[
          { label: "精选作品", value: galleryItems.length },
          { label: "当前结果", value: visibleItems.length },
          { label: "累计喜欢", value: galleryItems.reduce((sum, item) => sum + item.likes, 0) },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-border bg-card/95 p-4 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={ranking} onValueChange={setRanking}>
              <TabsList className="rounded-full bg-muted p-1">
                <TabsTrigger value="newest" className="rounded-full">最新推荐</TabsTrigger>
                <TabsTrigger value="weekly" className="rounded-full">七日热门</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-11 rounded-full pl-9" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索作品或作者" />
            </div>
          </div>
          <div className="grid gap-5">
            <FilterGroup title="影片类别" value={category} items={categories} onChange={setCategory} />
            <FilterGroup title="视觉风格" value={style} items={styles} onChange={setStyle} />
            <FilterGroup title="制作方式" value={technique} items={techniques} onChange={setTechnique} />
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <SearchEmptyState onReset={resetFilters} />
        ) : (
          <div className="columns-1 gap-5 space-y-5 sm:columns-2 lg:columns-3">
            {visibleItems.map((art) => (
              <button key={art.id} type="button" className="group block w-full break-inside-avoid cursor-pointer text-left" onClick={() => setSelected(art)}>
                <GalleryCard imageUrl={art.imageUrl} likes={art.likes} title={art.title} />
                <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-200 group-hover:border-primary/30 group-hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{art.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{art.author}</p>
                    </div>
                    <Aperture className="h-5 w-5 flex-shrink-0 text-primary" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{art.category}</Badge>
                    <Badge variant="outline">{art.style}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl p-0">
          {selected && (
            <div className="grid overflow-hidden rounded-2xl md:grid-cols-[1.25fr_0.75fr]">
              <img src={selected.imageUrl} alt={selected.title} className="h-full min-h-96 w-full object-cover" />
              <div className="flex flex-col p-6">
                <DialogHeader>
                  <DialogTitle>{selected.title}</DialogTitle>
                </DialogHeader>
                <p className="mt-2 text-sm text-muted-foreground">作者：{selected.author}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[selected.category, selected.style, selected.technique].map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted p-3">
                    <Heart className="mb-2 h-4 w-4 text-price" />
                    <p className="text-lg font-bold text-foreground">{selected.likes}</p>
                    <p className="text-xs text-muted-foreground">喜欢</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <Film className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-lg font-bold text-foreground">可参考</p>
                    <p className="text-xs text-muted-foreground">项目风格</p>
                  </div>
                </div>
                <Button className="mt-6 rounded-full" onClick={() => setSelected(null)}>
                  <X className="mr-2 h-4 w-4" />关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Gallery;
