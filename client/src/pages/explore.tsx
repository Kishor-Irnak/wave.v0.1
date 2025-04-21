import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BlogCard } from "@/components/blog/blog-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { Link } from "wouter";
import { queryDocuments } from "@/lib/firebase";

export default function Explore() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});
  const [trendingAuthors, setTrendingAuthors] = useState<any[]>([]);

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

  // Fetch trending authors from Firebase
  useState(() => {
    const fetchTrendingAuthors = async () => {
      try {
        const authorsData = await queryDocuments(
          'users',
          [],
          'createdAt',
          'desc',
          10
        );
        setTrendingAuthors(authorsData);
      } catch (error) {
        console.error("Error fetching trending authors:", error);
      }
    };

    fetchTrendingAuthors();
  });

  // Filter blogs based on search query
  const filteredBlogs = blogs
    ? blogs.filter((blog: any) => {
        if (!searchQuery) return true;
        return (
          blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : [];

  // Handle following authors
  const handleFollowAuthor = (authorId: string) => {
    if (!user) return;
    setIsFollowing((prev) => ({
      ...prev,
      [authorId]: !prev[authorId],
    }));
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Explore</h1>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for blogs, authors, or topics..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>

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
                  {trendingAuthors.slice(0, 5).map((author, index) => (
                    <div key={index} className="flex items-center space-x-2 py-2">
                      <Link href={`/profile/${author.username || author.id}`}>
                        <a>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={author.photoURL} />
                            <AvatarFallback>{getInitials(author.displayName || "User")}</AvatarFallback>
                          </Avatar>
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
              <Tabs defaultValue="latest" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="authors">Authors</TabsTrigger>
                </TabsList>

                <TabsContent value="latest">
                  {loadingBlogs ? (
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
                  ) : filteredBlogs.length > 0 ? (
                    <div className="space-y-8">
                      {filteredBlogs.map((blog: any) => (
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-600 mb-6">
                        No blogs matching your search criteria. Try different keywords or browse categories.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="popular">
                  {loadingBlogs ? (
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
                  ) : filteredBlogs.length > 0 ? (
                    <div className="space-y-8">
                      {/* For demonstration, just showing the same blogs but could be sorted by popularity */}
                      {filteredBlogs.map((blog: any) => (
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
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-600 mb-6">
                        No blogs matching your search criteria. Try different keywords or browse categories.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="authors">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trendingAuthors.map((author, index) => (
                      <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center space-x-3">
                          <Link href={`/profile/${author.username || author.id}`}>
                            <a>
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={author.photoURL} />
                                <AvatarFallback>{getInitials(author.displayName || "User")}</AvatarFallback>
                              </Avatar>
                            </a>
                          </Link>
                          <div className="flex-1">
                            <Link href={`/profile/${author.username || author.id}`}>
                              <a className="font-medium text-gray-900 hover:underline">
                                {author.displayName}
                              </a>
                            </Link>
                            <p className="text-sm text-gray-500">@{author.username || author.id}</p>
                          </div>
                        </div>
                        {author.bio && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {author.bio}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-900">{author.followers || 0}</span> followers
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleFollowAuthor(author.id)}
                          >
                            {isFollowing[author.id] ? "Following" : "Follow"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
