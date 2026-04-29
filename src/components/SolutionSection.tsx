import { Pause, Play } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const SolutionSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTogglePlayback = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    setDuration(video.duration || 0);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(video.currentTime);
    setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const nextProgress = Number(event.target.value);

    setProgress(nextProgress);

    if (video && video.duration) {
      video.currentTime = (nextProgress / 100) * video.duration;
      setCurrentTime(video.currentTime);
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          告别传统视频外包，迎接全新的AIGC解决办法。
        </h2>
        <p className="text-sm text-muted-foreground mb-12">
          流畅的承制体验，AI影制全面保证您的交易安全与质量
        </p>

        {/* Laptop mockup */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="bg-muted rounded-xl border-2 border-border p-3 shadow-xl">
            <div className="group/video relative bg-card rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded"
                src="/mecha-squad-pv.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="机甲战队项目视频预览"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center gap-3 rounded-full bg-foreground/45 px-3 py-2 text-background opacity-0 shadow-lg backdrop-blur-md transition-all duration-200 ease-out group-hover/video:pointer-events-auto group-hover/video:translate-y-0 group-hover/video:opacity-90 group-focus-within/video:pointer-events-auto group-focus-within/video:translate-y-0 group-focus-within/video:opacity-90">
                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-foreground transition hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
                  aria-label={isPlaying ? "暂停视频" : "播放视频"}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-0.5" aria-hidden="true" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progress}
                  onChange={handleSeek}
                  className="h-1.5 flex-1 cursor-pointer accent-background"
                  aria-label="视频播放进度"
                />
                <span className="min-w-20 text-right text-xs font-medium tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-4 -left-8 w-16 h-16 bg-primary/10 rounded-full" />
          <div className="absolute -bottom-4 -right-8 w-16 h-16 bg-primary/10 rounded-full" />
          <div className="absolute -top-4 left-1/4 w-8 h-8 bg-secondary/20 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
