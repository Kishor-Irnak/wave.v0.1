import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateShort, formatReadingTime } from "@/lib/date-utils";

interface FeaturedPostProps {
  id: number | string;
  title: string;
  content: string;
  coverImage: string;
  category: string;
  createdAt: Date;
  author: {
    id: number | string;
    username: string;
    displayName: string;
    photoURL?: string;
  };
}

export function FeaturedPost({
  id,
  title,
  content,
  coverImage,
  category,
  createdAt,
  author,
}: FeaturedPostProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="relative">
        <img
          className="w-full h-64 object-cover"
          src={coverImage}
          alt="Featured blog post cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6">
          <Link href={`/category/${category.toLowerCase()}`}>
            <a className="inline-block bg-primary/90 text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
              {category}
            </a>
          </Link>
          <Link href={`/blog/${id}`}>
            <a className="text-2xl font-bold text-white mb-2 hover:underline">
              {title}
            </a>
          </Link>
          <div className="flex items-center">
            <Link href={`/profile/${author.username}`}>
              <a className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.photoURL} />
                  <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium text-white">{author.displayName}</p>
                  <p className="text-xs text-gray-300">
                    {formatDateShort(createdAt)} · {formatReadingTime(content)}
                  </p>
                </div>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
