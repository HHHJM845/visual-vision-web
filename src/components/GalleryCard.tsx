import { Heart } from "lucide-react";

interface GalleryCardProps {
  imageUrl: string;
  likes: number;
  title?: string;
}

const GalleryCard = ({ imageUrl, likes, title = "artwork" }: GalleryCardProps) => {
  return (
    <div className="relative group rounded-lg overflow-hidden cursor-pointer">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 rounded-full px-2 py-1 text-xs">
        <Heart className="w-3 h-3 text-price" />
        <span className="text-foreground">{likes}</span>
      </div>
    </div>
  );
};

export default GalleryCard;
