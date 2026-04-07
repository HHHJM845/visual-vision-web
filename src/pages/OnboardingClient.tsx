import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { updateVerificationStatus } from "@/services/userService";
import { ClientVerificationType } from "@/types/user";

export default function OnboardingClient() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [verType, setVerType] = useState<ClientVerificationType>('realname');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const realnameForm = useForm<{ realname: string; idCard: string; code: string }>();
  const enterpriseForm = useForm<{ companyName: string; creditCode: string; contact: string; phone: string }>();

  if (!user) { navigate('/login'); return null; }

  async function handleRealname(data: { realname: string; idCard: string; code: string }) {
    if (!/^\d{6}$/.test(data.code)) { setError("请输入6位验证码"); return; }
    setSubmitting(true);
    const updated = await updateVerificationStatus(user!.id, 'verified', 'realname');
    setUser(updated);
    navigate('/dashboard/client');
  }

  async function handleEnterprise(data: { companyName: string; creditCode: string; contact: string; phone: string }) {
    if (!/^[0-9A-Z]{18}$/.test(data.creditCode)) { setError("请输入有效的18位统一社会信用代码"); return; }
    setSubmitting(true);
    const updated = await updateVerificationStatus(user!.id, 'verified', 'enterprise');
    setUser(updated);
    navigate('/dashboard/client');
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-bold">需求方资质认证</h1>
          <p className="text-muted-foreground text-sm mt-2">完成认证后即可发布项目</p>
        </div>

        {/* 认证类型选择 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([['realname', '👤', '个人实名认证', '实名认证标签'], ['enterprise', '🏢', '企业认证', '企业认证标签']] as const).map(
            ([t, emoji, title, sub]) => (
              <button key={t} type="button" onClick={() => { setVerType(t); setError(""); }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  verType === t ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
                }`}>
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </button>
            )
          )}
        </div>

        {verType === 'realname' && (
          <form onSubmit={realnameForm.handleSubmit(handleRealname)} className="space-y-4">
            <div>
              <Label>真实姓名</Label>
              <Input className="mt-1" placeholder="请输入真实姓名" {...realnameForm.register("realname", { required: true })} />
            </div>
            <div>
              <Label>身份证号</Label>
              <Input className="mt-1" placeholder="18位身份证号码" {...realnameForm.register("idCard", { required: true, minLength: 18, maxLength: 18 })} />
            </div>
            <div>
              <Label>手机验证码 <span className="text-xs text-muted-foreground">（mock：任意6位数字）</span></Label>
              <Input className="mt-1" placeholder="请输入6位验证码" maxLength={6} {...realnameForm.register("code", { required: true })} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "认证中..." : "提交认证"}
            </Button>
          </form>
        )}

        {verType === 'enterprise' && (
          <form onSubmit={enterpriseForm.handleSubmit(handleEnterprise)} className="space-y-4">
            <div>
              <Label>公司名称</Label>
              <Input className="mt-1" placeholder="请输入公司全称" {...enterpriseForm.register("companyName", { required: true })} />
            </div>
            <div>
              <Label>统一社会信用代码</Label>
              <Input className="mt-1" placeholder="18位信用代码" maxLength={18} {...enterpriseForm.register("creditCode", { required: true })} />
            </div>
            <div>
              <Label>联系人姓名</Label>
              <Input className="mt-1" placeholder="法定代表人或联系人" {...enterpriseForm.register("contact", { required: true })} />
            </div>
            <div>
              <Label>联系手机</Label>
              <Input className="mt-1" placeholder="请输入手机号" {...enterpriseForm.register("phone", { required: true })} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "认证中..." : "提交认证"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
