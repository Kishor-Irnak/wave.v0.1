import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogCard } from "@/components/blog/blog-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { MapPin, Link as LinkIcon, Clock } from "lucide-react";

export default function Profile({ params }: { params: { username: string } }) {
  const { username } = params;
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("articles");

  // Fetch profile user
  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: [`/api/users/username/${username}`],
    staleTime: 60000, // 1 minute
  });

  // Fetch user's blogs
  const { data: blogs, isLoading: loadingBlogs } = useQuery({
    queryKey: [`/api/blogs/user/${profileUser?.id}`],
    enabled: !!profileUser?.id,
  });

  // Fetch followers
  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: [`/api/followers/${profileUser?.id}`],
    enabled: !!profileUser?.id,
  });

  // Fetch following
  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: [`/api/following/${profileUser?.id}`],
    enabled: !!profileUser?.id,
  });

  // Check if current user is following this profile
  const isFollowing = dbUser && followers?.some((follower: any) => follower.followerId === dbUser.id);

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (follow: boolean) => {
      if (follow) {
        // Follow
        const response = await apiRequest("POST", "/api/followers", {
          followerId: dbUser!.id,
          followingId: profileUser.id,
        });
        return response.json();
      } else {
        // Unfollow
        const followerRecord = followers.find((f: any) => f.followerId === dbUser!.id);
        if (followerRecord) {
          const response = await apiRequest("DELETE", `/api/followers/${followerRecord.id}`);
          return response.json();
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/followers/${profileUser?.id}`] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You are no longer following ${profileUser.displayName}`
          : `You are now following ${profileUser.displayName}`,
      });
    },
    onError: (error) => {
      console.error("Follow/unfollow error:", error);
      toast({
        title: "Action failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFollowToggle = () => {
    if (!dbUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users.",
        variant: "destructive",
      });
      return;
    }
    
    followMutation.mutate(!isFollowing);
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <Skeleton className="h-32 w-full" />
                <div className="px-6 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5">
                    <div className="-mt-12 sm:-mt-16">
                      <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-white" />
                    </div>
                    <div className="mt-6 sm:mt-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Skeleton className="h-8 w-48" />
                          <Skeleton className="h-4 w-32 mt-2" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
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

  if (!profileUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                User not found
              </h1>
              <p className="text-gray-600 mb-6">
                The user you're looking for doesn't exist or has been removed.
              </p>
              <Button as={Link} href="/" className="mt-2">
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
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
              <div className="h-32 bg-gradient-to-r from-primary to-purple-500"></div>
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5">
                  <div className="-mt-12 sm:-mt-16">
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-white">
                      <AvatarImage src={profileUser.photoURL} />
                      <AvatarFallback className="text-lg">
                        {getInitials(profileUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="mt-6 sm:mt-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {profileUser.displayName}
                        </h1>
                        <p className="text-gray-600">@{profileUser.username}</p>
                      </div>
                      {dbUser?.id === profileUser.id ? (
                        <Link href="/settings">
                          <Button variant="outline" className="hidden sm:inline-flex">
                            Edit Profile
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          variant={isFollowing ? "outline" : "default"}
                          className="hidden sm:inline-flex"
                          onClick={handleFollowToggle}
                          disabled={followMutation.isPending}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center text-sm text-gray-700 sm:text-base">
                      {profileUser.location && (
                        <span className="flex items-center mr-4 mb-2 sm:mb-0">
                          <MapPin className="mr-1 h-5 w-5 text-gray-500" />
                          {profileUser.location}
                        </span>
                      )}
                      {profileUser.website && (
                        <span className="flex items-center mr-4 mb-2 sm:mb-0">
                          <LinkIcon className="mr-1 h-5 w-5 text-gray-500" />
                          <a
                            href={profileUser.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {profileUser.website.replace(/(^\w+:|^)\/\//, "")}
                          </a>
                        </span>
                      )}
                      <span className="flex items-center mb-2 sm:mb-0">
                        <Clock className="mr-1 h-5 w-5 text-gray-500" />
                        Joined {new Date(profileUser.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {profileUser.bio && (
                      <div className="mt-4">
                        <p className="text-gray-700">{profileUser.bio}</p>
                      </div>
                    )}
                    <div className="mt-4 flex space-x-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {followers?.length || 0}
                        </span>
                        <span className="ml-1 text-gray-500">Followers</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {following?.length || 0}
                        </span>
                        <span className="ml-1 text-gray-500">Following</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {blogs?.length || 0}
                        </span>
                        <span className="ml-1 text-gray-500">Posts</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="sm:hidden mt-4">
                  {dbUser?.id === profileUser.id ? (
                    <Link href="/settings">
                      <Button variant="outline" className="w-full">
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      className="w-full"
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <Tabs defaultValue="articles" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-8 border-b border-gray-200 w-full justify-start">
                <TabsTrigger value="articles" className="py-4 px-1">
                  Articles
                </TabsTrigger>
                {dbUser?.id === profileUser.id && (
                  <TabsTrigger value="drafts" className="py-4 px-1">
                    Drafts
                  </TabsTrigger>
                )}
                <TabsTrigger value="followers" className="py-4 px-1">
                  Followers
                </TabsTrigger>
                <TabsTrigger value="following" className="py-4 px-1">
                  Following
                </TabsTrigger>
              </TabsList>

              <TabsContent value="articles">
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
                ) : blogs && blogs.length > 0 ? (
                  <div className="space-y-8">
                    {blogs.map((blog: any) => (
                      <BlogCard
                        key={blog.id}
                        id={blog.id}
                        title={blog.title}
                        content={blog.content}
                        coverImage={blog.coverImage || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80"}
                        category={blog.category}
                        createdAt={new Date(blog.publishedAt)}
                        author={{
                          id: profileUser.id,
                          username: profileUser.username,
                          displayName: profileUser.displayName,
                          photoURL: profileUser.photoURL,
                        }}
                        likes={0} // This would be fetched from likes data
                        comments={0} // This would be fetched from comments data
                        isLiked={false} // This would be determined based on user's likes
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
                    <p className="text-gray-600 mb-6">
                      {dbUser?.id === profileUser.id
                        ? "You haven't published any articles yet. Start writing your first blog post today!"
                        : `${profileUser.displayName} hasn't published any articles yet.`}
                    </p>
                    {dbUser?.id === profileUser.id && (
                      <Link href="/create-blog">
                        <Button>Create your first blog</Button>
                      </Link>
                    )}
                  </div>
                )}
              </TabsContent>

              {dbUser?.id === profileUser.id && (
                <TabsContent value="drafts">
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts</h3>
                    <p className="text-gray-600 mb-6">
                      You don't have any draft posts. Start writing and save drafts for later!
                    </p>
                    <Link href="/create-blog">
                      <Button>Create new blog</Button>
                    </Link>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="followers">
                {loadingFollowers ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-3 flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : followers && followers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {followers.map((follower: any) => (
                      <div key={follower.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
                        <Link href={`/profile/${follower.follower?.username || follower.followerId}`}>
                          <Avatar className="h-12 w-12 cursor-pointer">
                            <AvatarImage src={follower.follower?.photoURL} />
                            <AvatarFallback>
                              {getInitials(follower.follower?.displayName || "User")}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="ml-3 flex-1">
                          <Link href={`/profile/${follower.follower?.username || follower.followerId}`}>
                            <a className="font-medium text-gray-900 hover:underline">
                              {follower.follower?.displayName || "User"}
                            </a>
                          </Link>
                          <p className="text-sm text-gray-500">@{follower.follower?.username || "user"}</p>
                        </div>
                        {dbUser && follower.followerId !== dbUser.id && (
                          <Button variant="outline" size="sm">
                            Follow
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
                    <p className="text-gray-600">
                      {dbUser?.id === profileUser.id
                        ? "You don't have any followers yet. Share your profile to gain followers!"
                        : `${profileUser.displayName} doesn't have any followers yet. Be the first to follow!`}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="following">
                {loadingFollowing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-3 flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : following && following.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {following.map((follow: any) => (
                      <div key={follow.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
                        <Link href={`/profile/${follow.following?.username || follow.followingId}`}>
                          <Avatar className="h-12 w-12 cursor-pointer">
                            <AvatarImage src={follow.following?.photoURL} />
                            <AvatarFallback>
                              {getInitials(follow.following?.displayName || "User")}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="ml-3 flex-1">
                          <Link href={`/profile/${follow.following?.username || follow.followingId}`}>
                            <a className="font-medium text-gray-900 hover:underline">
                              {follow.following?.displayName || "User"}
                            </a>
                          </Link>
                          <p className="text-sm text-gray-500">@{follow.following?.username || "user"}</p>
                        </div>
                        {dbUser && dbUser.id === profileUser.id && (
                          <Button variant="outline" size="sm">
                            Unfollow
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Not following anyone</h3>
                    <p className="text-gray-600">
                      {dbUser?.id === profileUser.id
                        ? "You're not following anyone yet. Explore and find interesting authors to follow!"
                        : `${profileUser.displayName} isn't following anyone yet.`}
                    </p>
                    {dbUser?.id === profileUser.id && (
                      <Link href="/explore">
                        <Button className="mt-4">Explore authors</Button>
                      </Link>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
