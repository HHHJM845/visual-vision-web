import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import CommissionCard from "@/components/CommissionCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissions } from "@/services/commissionService";

export default function Commissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: getCommissions,
  });

  const canPost = user?.role === 'client' && user.verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Tabs defaultValue="commercial">
            <TabsList className="bg-transparent gap-4 p-0">
              <TabsTrigger value="commercial" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">商业</TabsTrigger>
              <TabsTrigger value="personal" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">个人</TabsTrigger>
            </TabsList>
          </Tabs>
          {canPost && (
            <Button className="rounded-full" size="sm" onClick={() => navigate('/commissions/new')}>+ 发布项目</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select><SelectTrigger className="w-32"><SelectValue placeholder="最新发布" /></SelectTrigger><SelectContent><SelectItem value="newest">最新发布</SelectItem><SelectItem value="ending">即将截止</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="类型与风格" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="commercial">商业宣传片</SelectItem><SelectItem value="short">创意短片</SelectItem><SelectItem value="concept">概念影像</SelectItem><SelectItem value="video">短视频</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="报酬区间不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="low">1k以下</SelectItem><SelectItem value="mid">1k-5k</SelectItem><SelectItem value="high">5k以上</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="交付日期不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="week">一周内</SelectItem><SelectItem value="month">一月内</SelectItem></SelectContent></Select>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-16">加载中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissions.map((c) => (
              <CommissionCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                tag={c.tag}
                reputation={c.reputation}
                deadline={c.deadline}
                category={c.category}
                applicants={c.applicants}
                priceRange={c.priceRange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
