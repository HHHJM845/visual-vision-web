import Navbar from "@/components/Navbar";
import GalleryCard from "@/components/GalleryCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = ["全部", "商业宣传片", "创意短片", "概念影像", "短视频"];
const styles = ["全部", "二次元风", "国风古典", "欧美写实"];
const techniques = ["全部", "AI绘图生成", "AI动效合成", "AI真人合成", "AI写实渲染"];

const mockArtworks = [
  { imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop", likes: 557 },
  { imageUrl: "https://images.unsplash.com/photo-1611457194403-d3571b6a2924?w=400&h=500&fit=crop", likes: 118 },
  { imageUrl: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=450&fit=crop", likes: 282 },
  { imageUrl: "https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop", likes: 266 },
  { imageUrl: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=550&fit=crop", likes: 13 },
  { imageUrl: "https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=500&fit=crop", likes: 7 },
  { imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=480&fit=crop", likes: 209 },
  { imageUrl: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=520&fit=crop", likes: 55 },
  { imageUrl: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=400&h=600&fit=crop", likes: 223 },
  { imageUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400&h=450&fit=crop", likes: 48 },
  { imageUrl: "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=400&h=500&fit=crop", likes: 42 },
  { imageUrl: "https://images.unsplash.com/photo-1616627988170-851c46d63560?w=400&h=480&fit=crop", likes: 8 },
];

const Gallery = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="newest" className="mb-6 flex justify-center">
          <TabsList className="bg-transparent gap-6 p-0">
            <TabsTrigger value="newest" className="text-base data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">最新推荐</TabsTrigger>
            <TabsTrigger value="weekly" className="text-base data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">七日热门</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="w-48 flex-shrink-0 hidden md:block">
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-card-foreground mb-3">影片类别</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((c) => (
                  <Badge key={c} variant={c === "全部" ? "default" : "outline"} className="cursor-pointer text-xs">{c}</Badge>
                ))}
              </div>
              <h4 className="text-sm text-muted-foreground mb-2">风格</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {styles.map((s) => (
                  <Badge key={s} variant={s === "全部" ? "default" : "outline"} className="cursor-pointer text-xs">{s}</Badge>
                ))}
              </div>
              <h4 className="text-sm text-muted-foreground mb-2">制作方式</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {techniques.map((t) => (
                  <Badge key={t} variant={t === "全部" ? "default" : "outline"} className="cursor-pointer text-xs">{t}</Badge>
                ))}
              </div>
              <h4 className="text-sm text-muted-foreground mb-2">属性</h4>
              <div className="flex flex-wrap gap-2">
                {["全部", "男性", "女性"].map((g) => (
                  <Badge key={g} variant={g === "全部" ? "default" : "outline"} className="cursor-pointer text-xs">{g}</Badge>
                ))}
              </div>
            </div>
          </aside>

          {/* Masonry grid */}
          <div className="flex-1 columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {mockArtworks.map((art, i) => (
              <div key={i} className="break-inside-avoid">
                <GalleryCard {...art} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
