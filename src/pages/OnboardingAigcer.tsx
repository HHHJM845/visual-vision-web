import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { updateVerificationStatus, saveAigcerProfile } from "@/services/userService";
import { AigcerProfile, PortfolioItem } from "@/types/user";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { generateId } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STYLE_OPTIONS = ["二次元", "国风古典", "欧美写实", "科幻未来", "写实渲染", "赛博朋克", "奇幻史诗"];
const TOOL_OPTIONS = ["Midjourney", "Runway", "Kling", "Sora", "ComfyUI", "Stable Diffusion", "Pika"];

interface LocalPortfolioItem extends PortfolioItem {
  _file?: File;
}

export default function OnboardingAigcer() {
  const navigate = useNavigate();
  const { user, setUser, isLoading } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<LocalPortfolioItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate("/login", { replace: true, state: { from: "/onboarding/aigcer" } });
  }, [isLoading, navigate, user]);

  function toggleTag(list: string[], setList: (value: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag]);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setPortfolio((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: generateId(),
        title: file.name.replace(/\.[^.]+$/, ""),
        description: "",
        imageUrl: URL.createObjectURL(file),
        _file: file,
      })),
    ]);
    e.target.value = "";
  }

  function updatePortfolioItem(id: string, field: "title" | "description", value: string) {
    setPortfolio((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removePortfolioItem(id: string) {
    setPortfolio((prev) => prev.filter((item) => item.id !== id));
  }

  async function uploadPortfolioItem(item: LocalPortfolioItem): Promise<PortfolioItem> {
    if (!item._file || !user || !isSupabaseConfigured) {
      return { id: item.id, title: item.title, description: item.description, imageUrl: item.imageUrl };
    }

    const ext = item._file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${item.id}.${ext}`;
    const { error } = await supabase.storage.from("portfolios").upload(path, item._file, { upsert: true });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from("portfolios").getPublicUrl(path);
    return { id: item.id, title: item.title, description: item.description, imageUrl: data.publicUrl };
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError("");

    try {
      const uploadedPortfolio = await Promise.all(portfolio.map(uploadPortfolioItem));
      const profile: AigcerProfile = {
        bio,
        styles: selectedStyles,
        tools: selectedTools,
        portfolio: uploadedPortfolio,
      };

      const savedUser = await saveAigcerProfile(user.id, profile);
      const verifiedUser = await updateVerificationStatus(user.id, "verified");
      setUser({
        ...verifiedUser,
        aigcerProfile: savedUser.aigcerProfile ?? profile,
      });
      toast({ title: "认证通过", description: "作品集已同步到创作者工作台。" });
      navigate("/dashboard/aigcer?tab=portfolio", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交审核失败，请稍后重试");
      setSubmitting(false);
    }
  }

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">AIGCer 资质认证</h1>
          <p className="text-muted-foreground text-sm mt-2">完成认证后即可应征项目</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= item ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>{item}</div>
                {item < 2 && <div className={`w-12 h-0.5 ${step > item ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 1 - 个人资质</h2>
              <div>
                <Label>个人简介</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  maxLength={160}
                  placeholder="介绍一下你的创作风格和项目经验..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/160</p>
              </div>
              <div>
                <Label>擅长风格，多选</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STYLE_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(selectedStyles, setSelectedStyles, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedStyles.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>常用工具，多选</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOOL_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(selectedTools, setSelectedTools, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedTools.includes(tag)
                          ? "bg-secondary text-secondary-foreground border-secondary"
                          : "border-border hover:border-secondary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full rounded-full"
                onClick={() => setStep(2)}
                disabled={bio.trim().length < 10 || selectedStyles.length === 0}
              >
                下一步
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 2 - 上传作品集</h2>
              <p className="text-sm text-muted-foreground">至少上传 3 件作品用于资质审核。</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors"
              >
                <p className="text-sm text-muted-foreground">点击上传图片，支持批量选择</p>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

              {portfolio.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                  <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="作品标题"
                      value={item.title}
                      onChange={(e) => updatePortfolioItem(item.id, "title", e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="简短说明"
                      value={item.description}
                      onChange={(e) => updatePortfolioItem(item.id, "description", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    删除
                  </button>
                </div>
              ))}

              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button className="flex-1 rounded-full" onClick={handleSubmit} disabled={portfolio.length < 3 || submitting}>
                  {submitting ? "提交中..." : "提交认证"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
