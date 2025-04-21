import { 
  users, type User, type InsertUser,
  blogs, type Blog, type InsertBlog,
  likes, type Like, type InsertLike,
  followers, type Follower, type InsertFollower,
  comments, type Comment, type InsertComment
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUid(uid: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // Blog operations
  getBlog(id: number): Promise<Blog | undefined>;
  getBlogs(limit?: number, offset?: number): Promise<Blog[]>;
  getBlogsByUser(userId: number): Promise<Blog[]>;
  getBlogsByCategory(category: string): Promise<Blog[]>;
  createBlog(blog: InsertBlog): Promise<Blog>;
  updateBlog(id: number, blog: Partial<Blog>): Promise<Blog>;
  deleteBlog(id: number): Promise<boolean>;
  
  // Like operations
  getLike(userId: number, blogId: number): Promise<Like | undefined>;
  getLikesByBlog(blogId: number): Promise<Like[]>;
  getLikesByUser(userId: number): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<boolean>;
  
  // Follower operations
  getFollower(followerId: number, followingId: number): Promise<Follower | undefined>;
  getFollowers(userId: number): Promise<Follower[]>;
  getFollowing(userId: number): Promise<Follower[]>;
  createFollower(follower: InsertFollower): Promise<Follower>;
  deleteFollower(id: number): Promise<boolean>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByBlog(blogId: number): Promise<Comment[]>;
  getCommentsByUser(userId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<Comment>): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blogs: Map<number, Blog>;
  private likes: Map<number, Like>;
  private followers: Map<number, Follower>;
  private comments: Map<number, Comment>;
  
  private userId: number;
  private blogId: number;
  private likeId: number;
  private followerId: number;
  private commentId: number;

  constructor() {
    this.users = new Map();
    this.blogs = new Map();
    this.likes = new Map();
    this.followers = new Map();
    this.comments = new Map();
    
    this.userId = 1;
    this.blogId = 1;
    this.likeId = 1;
    this.followerId = 1;
    this.commentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.uid === uid);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Blog operations
  async getBlog(id: number): Promise<Blog | undefined> {
    return this.blogs.get(id);
  }

  async getBlogs(limit = 10, offset = 0): Promise<Blog[]> {
    return Array.from(this.blogs.values())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
  }

  async getBlogsByUser(userId: number): Promise<Blog[]> {
    return Array.from(this.blogs.values())
      .filter(blog => blog.userId === userId)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async getBlogsByCategory(category: string): Promise<Blog[]> {
    return Array.from(this.blogs.values())
      .filter(blog => blog.category === category)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async createBlog(blog: InsertBlog): Promise<Blog> {
    const id = this.blogId++;
    const newBlog: Blog = { ...blog, id };
    this.blogs.set(id, newBlog);
    return newBlog;
  }

  async updateBlog(id: number, blogData: Partial<Blog>): Promise<Blog> {
    const blog = this.blogs.get(id);
    if (!blog) {
      throw new Error("Blog not found");
    }
    
    const updatedBlog = { ...blog, ...blogData };
    this.blogs.set(id, updatedBlog);
    return updatedBlog;
  }

  async deleteBlog(id: number): Promise<boolean> {
    return this.blogs.delete(id);
  }

  // Like operations
  async getLike(userId: number, blogId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.blogId === blogId
    );
  }

  async getLikesByBlog(blogId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.blogId === blogId);
  }

  async getLikesByUser(userId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(like => like.userId === userId);
  }

  async createLike(like: InsertLike): Promise<Like> {
    const id = this.likeId++;
    const newLike: Like = { ...like, id };
    this.likes.set(id, newLike);
    return newLike;
  }

  async deleteLike(id: number): Promise<boolean> {
    return this.likes.delete(id);
  }

  // Follower operations
  async getFollower(followerId: number, followingId: number): Promise<Follower | undefined> {
    return Array.from(this.followers.values()).find(
      follower => follower.followerId === followerId && follower.followingId === followingId
    );
  }

  async getFollowers(userId: number): Promise<Follower[]> {
    return Array.from(this.followers.values()).filter(
      follower => follower.followingId === userId
    );
  }

  async getFollowing(userId: number): Promise<Follower[]> {
    return Array.from(this.followers.values()).filter(
      follower => follower.followerId === userId
    );
  }

  async createFollower(follower: InsertFollower): Promise<Follower> {
    const id = this.followerId++;
    const newFollower: Follower = { ...follower, id };
    this.followers.set(id, newFollower);
    return newFollower;
  }

  async deleteFollower(id: number): Promise<boolean> {
    return this.followers.delete(id);
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByBlog(blogId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.blogId === blogId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCommentsByUser(userId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const newComment: Comment = { ...comment, id };
    this.comments.set(id, newComment);
    return newComment;
  }

  async updateComment(id: number, commentData: Partial<Comment>): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    const updatedComment = { ...comment, ...commentData };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
}

export const storage = new MemStorage();
