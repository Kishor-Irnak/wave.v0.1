import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDate, formatReadingTime, getRelativeTime } from "@/lib/date-utils";
import { Heart, MessageSquare, Share2, Bookmark, ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';

export default function BlogDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [_, navigate] = useLocation();
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  // Fetch blog post
  const { data: blog, isLoading: loadingBlog, error: blogError } = useQuery({
    queryKey: [`/api/blogs/${id}`],
    staleTime: 60000, // 1 minute
  });

  // Fetch author
  const { data: author, isLoading: loadingAuthor } = useQuery({
    queryKey: [`/api/users/${blog?.userId}`],
    enabled: !!blog?.userId,
  });

  // Fetch comments
  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: [`/api/comments/blog/${id}`],
    enabled: !!id,
  });

  // Fetch likes
  const { data: likes, isLoading: loadingLikes } = useQuery({
    queryKey: [`/api/likes/blog/${id}`],
    enabled: !!id,
  });

  // Check if current user has liked the post
  useEffect(() => {
    if (likes && dbUser) {
      const userLike = likes.find((like: any) => like.userId === dbUser.id);
      setIsLiked(!!userLike);
    }
  }, [likes, dbUser]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: any) => {
      const response = await apiRequest("POST", "/api/comments", commentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/blog/${id}`] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Failed to add comment",
        description: "An error occurred while adding your comment.",
        variant: "destructive",
      });
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      if (liked) {
        // Unlike
        const likeToDelete = likes.find((like: any) => like.userId === dbUser.id);
        if (likeToDelete) {
          const response = await apiRequest("DELETE", `/api/likes/${likeToDelete.id}`);
          return response.json();
        }
      } else {
        // Like
        const response = await apiRequest("POST", "/api/likes", {
          userId: dbUser.id,
          blogId: parseInt(id),
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/likes/blog/${id}`] });
      setIsLiked(!isLiked);
    },
    onError: (error) => {
      console.error("Error toggling like:", error);
      toast({
        title: "Failed to update like",
        description: "An error occurred while updating your like.",
        variant: "destructive",
      });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!dbUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to comment on this post.",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate({
      userId: dbUser.id,
      blogId: parseInt(id),
      content: commentText,
      createdAt: new Date().toISOString(),
    });
  };

  const handleLikeToggle = () => {
    if (!dbUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like this post.",
        variant: "destructive",
      });
      return;
    }

    toggleLikeMutation.mutate(isLiked);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loadingBlog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              <Skeleton className="w-full h-96 rounded-lg mb-8" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (blogError || !blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Blog post not found
              </h1>
              <p className="text-gray-600 mb-6">
                The blog post you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/")} className="mt-2">
                Return to homepage
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <img
                className="w-full h-96 object-cover"
                src={blog.coverImage || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"}
                alt={blog.title}
              />

              <div className="p-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Link href={`/category/${blog.category.toLowerCase()}`}>
                    <a className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {blog.category}
                    </a>
                  </Link>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500 text-sm">
                    {formatDate(new Date(blog.publishedAt))}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {blog.title}
                </h1>

                <div className="flex items-center mb-6">
                  {!loadingAuthor && author ? (
                    <>
                      <Link href={`/profile/${author.username}`}>
                        <a>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={author.photoURL} />
                            <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
                          </Avatar>
                        </a>
                      </Link>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <Link href={`/profile/${author.username}`}>
                            <a className="text-base font-medium text-gray-900 hover:underline">
                              {author.displayName}
                            </a>
                          </Link>
                          {dbUser && dbUser.id !== author.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2 text-xs py-1 px-2 rounded-full"
                            >
                              Follow
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {likes?.length || 0} followers • {formatReadingTime(blog.content)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="ml-3">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32 mt-1" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none">
                  <ReactMarkdown>{blog.content}</ReactMarkdown>
                </div>

                <div className="border-t border-gray-200 mt-8 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <button
                        className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                        onClick={handleLikeToggle}
                      >
                        <Heart
                          className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`}
                        />
                        <span>{likes?.length || 0} likes</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-primary">
                        <MessageSquare className="w-6 h-6" />
                        <span>{comments?.length || 0} comments</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-primary">
                        <Share2 className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-primary">
                        <Bookmark className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Comments
                    </h3>

                    <form onSubmit={handleCommentSubmit} className="flex space-x-3 mb-6">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{user ? getInitials(user.displayName || user.email || "") : "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full"
                        />
                      </div>
                      <Button type="submit" disabled={!user || !commentText.trim() || addCommentMutation.isPending}>
                        Post
                      </Button>
                    </form>

                    {/* Comment threads */}
                    {loadingComments ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-24 w-full rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-6">
                        {comments.map((comment: any) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.user?.photoURL} />
                              <AvatarFallback>{getInitials(comment.user?.displayName || "User")}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="bg-gray-100 rounded-lg px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {comment.user?.displayName || "User"}
                                    {author && comment.userId === author.id && (
                                      <span className="text-xs text-primary font-normal ml-1">
                                        Author
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {getRelativeTime(new Date(comment.createdAt))}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                              </div>
                              <div className="flex items-center mt-1 ml-1 space-x-4">
                                <button className="text-xs text-gray-500 hover:text-primary">
                                  Like
                                </button>
                                <button className="text-xs text-gray-500 hover:text-primary">
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
