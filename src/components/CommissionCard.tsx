import { Calendar, Diamond, Users } from "lucide-react";
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
    <Link to={`/commissions/${id}`} className="block border border-border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer bg-card">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-card-foreground mb-2 truncate">{title}</h3>
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
      <div className="text-right mt-2">
        <span className="text-lg font-bold text-price">{priceRange}</span>
      </div>
    </Link>
  );
};

export default CommissionCard;
