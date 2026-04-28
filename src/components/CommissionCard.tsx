import { Calendar, Diamond, Users, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface CommissionCardProps {
  title: string;
  description: string;
  tag: "实名认证" | "企业认证" | "未认证";
  reputation: string;
  deadline: string;
  category: string;
  applicants: number;
  priceRange: string;
  thumbnail?: string;
  id?: number;
}

const tagColorMap = {
  "实名认证": "bg-tag-realname text-primary-foreground",
  "企业认证": "bg-tag-enterprise text-primary-foreground",
  "未认证": "bg-muted text-muted-foreground",
};

const CommissionCard = ({
  title,
  description,
  tag,
  reputation,
  deadline,
  category,
  applicants,
  priceRange,
  thumbnail,
  id = 0,
}: CommissionCardProps) => {
  return (
    <Link to={`/commissions/${id}`} className="group block cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-card-foreground line-clamp-1">{title}</h3>
            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`text-xs ${tagColorMap[tag]} border-0`}>{tag}</Badge>
            <span className="text-xs text-muted-foreground">{reputation}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{deadline} 交付
            </span>
            <span className="flex items-center gap-1">
              <Diamond className="w-3.5 h-3.5" />{category}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />{applicants} 人应征
            </span>
          </div>
        </div>
        {thumbnail && (
          <img src={thumbnail} alt={title} className="w-16 h-16 rounded object-cover flex-shrink-0" loading="lazy" />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">托管预算</span>
        <span className="text-lg font-bold text-price">{priceRange}</span>
      </div>
    </Link>
  );
};

export default CommissionCard;
