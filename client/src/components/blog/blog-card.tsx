import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare } from "lucide-react";
import { formatDateShort, getRelativeTime, formatReadingTime } from "@/lib/date-utils";

interface BlogCardProps {
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
  likes: number;
  comments: number;
  isLiked?: boolean;
  onLike?: () => void;
}

export function BlogCard({
  id,
  title,
  content,
  coverImage,
  category,
  createdAt,
  author,
  likes,
  comments,
  isLiked = false,
  onLike
}: BlogCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const truncateContent = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Extract plain text from markdown content
  const plainTextContent = content.replace(/[#*`>_[\]()!]/g, "");

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition duration-300">
      <div className="md:flex">
        <div className="md:flex-shrink-0">
          <Link href={`/blog/${id}`}>
            <img
              className="h-48 w-full object-cover md:w-48 cursor-pointer"
              src={coverImage}
              alt={title}
            />
          </Link>
        </div>
        <div className="p-6 flex flex-col">
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
            <span className="text-primary font-medium">{category}</span>
            <span>•</span>
            <span>{getRelativeTime(createdAt)}</span>
          </div>
          <Link href={`/blog/${id}`}>
            <a className="block mt-1 text-lg leading-tight font-semibold text-gray-900 hover:underline">
              {title}
            </a>
          </Link>
          <p className="mt-2 text-gray-600 line-clamp-2">
            {truncateContent(plainTextContent)}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <Link href={`/profile/${author.username}`}>
              <a className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author.photoURL} />
                  <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-900">{author.displayName}</p>
                </div>
              </a>
            </Link>
            <div className="flex space-x-3 text-sm text-gray-500">
              <button 
                className="flex items-center focus:outline-none"
                onClick={onLike}
              >
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} 
                />
                <span className="ml-1">{likes}</span>
              </button>
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="ml-1">{comments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
