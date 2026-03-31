import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor } from "lucide-react";

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-16">
        {/* Left: text content */}
        <div className="flex-shrink-0 max-w-sm">
          <h1 className="text-4xl font-bold text-foreground leading-tight mb-3">
            AI影制APP
            <br />
            让承制事半功倍
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            简单好用，轻松发布&nbsp;&nbsp;|&nbsp;&nbsp;AIGCer橱窗，随心挑选
            <br />
            即时沟通，安心可靠
          </p>

          {/* QR + buttons */}
          <div className="flex items-center gap-4 mb-6">
            {/* QR code placeholder */}
            <div className="w-24 h-24 bg-foreground/5 border border-border rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="grid grid-cols-5 gap-0.5 p-1">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,7,17,6,11,12,13,18].includes(i)
                        ? "bg-foreground"
                        : "bg-background"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-28 bg-primary text-primary-foreground rounded-full">
                安卓版
              </Button>
              <Button className="w-28 bg-primary text-primary-foreground rounded-full">
                iOS 版
              </Button>
            </div>
          </div>

          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Monitor className="w-4 h-4" />
            桌面版下载
          </button>
        </div>

        {/* Right: phone mockups */}
        <div className="flex-1 relative h-[520px] hidden md:block">
          {/* Main center phone */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 z-20">
            <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-700">
              <div className="bg-background rounded-[2rem] overflow-hidden">
                {/* Notch */}
                <div className="bg-gray-900 h-6 flex items-center justify-center">
                  <div className="w-16 h-3 bg-gray-800 rounded-full" />
                </div>
                {/* Screen content */}
                <div className="bg-background p-2 h-80 overflow-hidden">
                  <div className="bg-primary/10 rounded p-2 mb-2 text-xs text-primary font-medium">橱窗</div>
                  <div className="space-y-2">
                    {["快速交付", "好推荐", "最新上架"].map((section) => (
                      <div key={section}>
                        <div className="text-xs font-semibold text-foreground mb-1">{section}</div>
                        <div className="grid grid-cols-3 gap-1">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="aspect-square bg-accent rounded text-center flex items-center justify-center text-lg">
                              {["🎬", "⚡", "🎥", "✨", "🌌", "🤖", "💫", "🎨", "🦋"][Math.floor(Math.random() * 9)]}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back left phone */}
          <div className="absolute left-4 top-8 w-40 z-10 rotate-[-12deg] opacity-80">
            <div className="bg-gray-800 rounded-[2rem] p-1.5 shadow-xl border-2 border-gray-600">
              <div className="bg-background rounded-[1.5rem] overflow-hidden">
                <div className="bg-gray-900 h-4 flex items-center justify-center">
                  <div className="w-10 h-2 bg-gray-800 rounded-full" />
                </div>
                <div className="p-2 h-52">
                  <div className="text-xs font-bold text-foreground mb-2">项目广场</div>
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-accent/60 rounded p-1.5 mb-1.5 text-xs text-muted-foreground">
                      AI影片需求 #{i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Back right phone */}
          <div className="absolute right-4 top-8 w-40 z-10 rotate-[12deg] opacity-80">
            <div className="bg-gray-800 rounded-[2rem] p-1.5 shadow-xl border-2 border-gray-600">
              <div className="bg-background rounded-[1.5rem] overflow-hidden">
                <div className="bg-gray-900 h-4 flex items-center justify-center">
                  <div className="w-10 h-2 bg-gray-800 rounded-full" />
                </div>
                <div className="p-2 h-52">
                  <div className="text-xs font-bold text-foreground mb-2">工作台</div>
                  {["概念稿 20%", "分镜 40%", "粗剪 70%"].map((stage) => (
                    <div key={stage} className="mb-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                        <span>{stage.split(" ")[0]}</span>
                        <span>{stage.split(" ")[1]}</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: stage.split(" ")[1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Small floating card */}
          <div className="absolute bottom-12 left-8 z-30 w-44 bg-card border border-border rounded-xl shadow-lg p-3">
            <div className="text-xs font-semibold text-foreground mb-1">AI短片创作项目</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <span>🎬 虚拟主播·角色设计</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">¥99/件</span>
              <button className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">应征</button>
            </div>
          </div>
        </div>

        {/* Mobile fallback illustration */}
        <div className="md:hidden flex flex-col items-center gap-4 text-muted-foreground">
          <Smartphone className="w-24 h-24 text-primary/30" />
          <p className="text-sm">扫描上方二维码下载App</p>
        </div>
      </div>
    </div>
  );
};

export default AppPage;
