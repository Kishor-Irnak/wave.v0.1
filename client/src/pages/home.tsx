import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FeaturedPost } from "@/components/blog/featured-post";
import { BlogCard } from "@/components/blog/blog-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryDocuments, FirebaseUser } from "@/lib/firebase";

export default function Home() {
  const { user } = useAuth();
  const [trendingAuthors, setTrendingAuthors] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});

  // Fetch blogs
  const { data: blogs, isLoading: loadingBlogs } = useQuery({
    queryKey: ['/api/blogs'],
    staleTime: 60000, // 1 minute
  });

  // Fetch categories
  const categories = [
    { name: "Technology", color: "bg-red-500" },
    { name: "Design", color: "bg-blue-500" },
    { name: "Business", color: "bg-green-500" },
    { name: "Science", color: "bg-yellow-500" },
    { name: "Health", color: "bg-purple-500" },
    { name: "Lifestyle", color: "bg-pink-500" },
  ];

  useEffect(() => {
    // Fetch trending authors from Firebase
    const fetchTrendingAuthors = async () => {
      try {
        const authorsData = await queryDocuments(
          'users',
          [],
          'createdAt',
          'desc',
          5
        );
        setTrendingAuthors(authorsData);
      } catch (error) {
        console.error("Error fetching trending authors:", error);
      }
    };

    fetchTrendingAuthors();
  }, []);

  // Handler for following authors
  const handleFollowAuthor = async (authorId: string) => {
    if (!user) return;
    
    try {
      // Toggle follow status
      const newIsFollowing = { ...isFollowing };
      newIsFollowing[authorId] = !newIsFollowing[authorId];
      setIsFollowing(newIsFollowing);
      
      if (!newIsFollowing[authorId]) {
        // Unfollow logic - would be done through API
      } else {
        // Follow logic - would be done through API
      }
    } catch (error) {
      console.error("Error following author:", error);
      // Revert state on error
      const newIsFollowing = { ...isFollowing };
      newIsFollowing[authorId] = !newIsFollowing[authorId];
      setIsFollowing(newIsFollowing);
    }
  };

  // Handler for liking blogs
  const handleLikeBlog = async (blogId: number) => {
    if (!user) return;
    
    try {
      // API call to toggle like
      // This would be implemented with API calls to backend
    } catch (error) {
      console.error("Error liking blog:", error);
    }
  };

  if (loadingBlogs) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:space-x-8">
              {/* Sidebar skeleton */}
              <div className="w-full md:w-64 mb-8 md:mb-0">
                <div className="bg-white rounded-lg shadow p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-2 w-2 rounded-full mr-2" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main content skeleton */}
              <div className="flex-1">
                <Skeleton className="w-full h-64 rounded-xl mb-8" />
                
                <div className="space-y-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="md:flex">
                        <Skeleton className="h-48 w-full md:w-48" />
                        <div className="p-6 w-full">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-6 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-8 w-24 rounded-full" />
                            <div className="flex space-x-3">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Left Sidebar */}
            <div className="w-full md:w-64 mb-8 md:mb-0">
              <div className="bg-white rounded-lg shadow p-4 sticky top-24">
                <h3 className="font-medium text-gray-900 mb-4">Browse Topics</h3>
                <ul className="space-y-2">
                  {categories.map((category, index) => (
                    <li key={index}>
                      <Link href={`/category/${category.name.toLowerCase()}`}>
                        <a className="flex items-center text-gray-700 hover:text-primary">
                          <span className={`w-2 h-2 ${category.color} rounded-full mr-2`}></span>
                          {category.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-4 pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Trending Authors</h3>
                  {trendingAuthors.map((author, index) => (
                    <div key={index} className="flex items-center space-x-2 py-2">
                      <Link href={`/profile/${author.username || author.id}`}>
                        <a>
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={author.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName)}`}
                            alt="Author profile"
                          />
                        </a>
                      </Link>
                      <div className="flex-grow">
                        <Link href={`/profile/${author.username || author.id}`}>
                          <a className="text-sm font-medium text-gray-900 hover:underline">
                            {author.displayName}
                          </a>
                        </Link>
                        <p className="text-xs text-gray-500">{author.followers || 0} followers</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-2 rounded-full"
                        onClick={() => handleFollowAuthor(author.id)}
                      >
                        {isFollowing[author.id] ? "Following" : "Follow"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Featured Post */}
              {blogs && blogs.length > 0 && (
                <FeaturedPost
                  id={blogs[0].id}
                  title={blogs[0].title}
                  content={blogs[0].content}
                  coverImage={blogs[0].coverImage || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"}
                  category={blogs[0].category}
                  createdAt={new Date(blogs[0].publishedAt)}
                  author={{
                    id: blogs[0].userId,
                    username: "user", // This would be fetched from the user data
                    displayName: "User", // This would be fetched from the user data
                    photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  }}
                />
              )}

              {/* Blog Post Feed */}
              <div className="space-y-8">
                {blogs && blogs.slice(1).map((blog: any, index: number) => (
                  <BlogCard
                    key={blog.id}
                    id={blog.id}
                    title={blog.title}
                    content={blog.content}
                    coverImage={blog.coverImage || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80"}
                    category={blog.category}
                    createdAt={new Date(blog.publishedAt)}
                    author={{
                      id: blog.userId,
                      username: "user", // This would be fetched from the user data
                      displayName: "User", // This would be fetched from the user data
                      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    }}
                    likes={123} // This would be fetched from likes data
                    comments={45} // This would be fetched from comments data
                    isLiked={false} // This would be determined based on user's likes
                    onLike={() => handleLikeBlog(blog.id)}
                  />
                ))}
              </div>

              {blogs && blogs.length > 5 && (
                <div className="flex justify-center mt-8">
                  <Button variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
