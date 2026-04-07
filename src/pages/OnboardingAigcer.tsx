import { useState, useRef } from "react";
import { generateId } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { updateVerificationStatus, saveAigcerProfile } from "@/services/userService";
import { AigcerProfile, PortfolioItem } from "@/types/user";

const STYLE_OPTIONS = ["二次元", "国风古典", "欧美写实", "科幻未来", "写实渲染", "赛博朋克", "奇幻史诗"];
const TOOL_OPTIONS = ["Midjourney", "Runway", "Kling", "Sora", "ComfyUI", "Stable Diffusion", "Pika"];

export default function OnboardingAigcer() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPortfolio(prev => [...prev, {
        id: generateId(),
        title: file.name.replace(/\.[^.]+$/, ''),
        description: "",
        imageBase64: base64,
      }]);
    }
  }

  function updatePortfolioItem(id: string, field: 'title' | 'description', value: string) {
    setPortfolio(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  function removePortfolioItem(id: string) {
    setPortfolio(prev => prev.filter(p => p.id !== id));
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const profile: AigcerProfile = { bio, styles: selectedStyles, tools: selectedTools, portfolio };
    await saveAigcerProfile(user.id, profile);
    const pendingUser = await updateVerificationStatus(user.id, 'pending');
    setUser(pendingUser);
    // Mock 3秒后自动通过
    setTimeout(async () => {
      const verifiedUser = await updateVerificationStatus(user.id, 'verified');
      setUser(verifiedUser);
      navigate('/dashboard/aigcer');
    }, 3000);
  }

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-bold text-foreground">AIGCer 资质认证</h1>
          <p className="text-muted-foreground text-sm mt-2">完成认证后即可应征项目</p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={`flex items-center gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 1 — 个人资质</h2>

              <div>
                <Label>个人简介</Label>
                <Textarea
                  className="mt-1" rows={3} maxLength={100}
                  placeholder="介绍一下你的创作风格和经验..."
                  value={bio} onChange={e => setBio(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/100</p>
              </div>

              <div>
                <Label>擅长风格（多选）</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STYLE_OPTIONS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(selectedStyles, setSelectedStyles, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedStyles.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label>常用工具（多选）</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOOL_OPTIONS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(selectedTools, setSelectedTools, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedTools.includes(tag) ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border hover:border-secondary'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              <Button className="w-full rounded-full" onClick={() => setStep(2)}
                disabled={bio.length < 10 || selectedStyles.length === 0}>
                下一步
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 2 — 上传作品集</h2>
              <p className="text-sm text-muted-foreground">至少上传 3 件作品用于资质审核</p>

              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm text-muted-foreground">点击上传图片（支持批量选择）</p>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

              {portfolio.map(item => (
                <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                  <img src={item.imageBase64} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 space-y-1">
                    <Input placeholder="作品标题" value={item.title}
                      onChange={e => updatePortfolioItem(item.id, 'title', e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="简短说明" value={item.description}
                      onChange={e => updatePortfolioItem(item.id, 'description', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <button onClick={() => removePortfolioItem(item.id)} className="text-muted-foreground hover:text-destructive">✕</button>
                </div>
              ))}

              {submitting && (
                <div className="text-center py-4">
                  <div className="text-primary text-2xl mb-2">⏳</div>
                  <p className="text-sm font-medium text-primary">审核中，预计 3 秒后通过...</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>上一步</Button>
                <Button className="flex-1 rounded-full" onClick={handleSubmit}
                  disabled={portfolio.length < 3 || submitting}>
                  提交审核
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
