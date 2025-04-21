import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertBlogSchema, 
  insertLikeSchema, 
  insertFollowerSchema, 
  insertCommentSchema 
} from "@shared/schema";
import { ZodError } from "zod";

function handleError(err: unknown, res: Response) {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: err.errors 
    });
  }
  return res.status(500).json({ message: "Internal server error" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/users/uid/:uid", async (req, res) => {
    try {
      const uid = req.params.uid;
      const user = await storage.getUserByUid(uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/users/username/:username", async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);
      return res.status(201).json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const user = await storage.updateUser(id, userData);
      return res.json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Blog routes
  app.get("/api/blogs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const blogs = await storage.getBlogs(limit, offset);
      return res.json(blogs);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const blog = await storage.getBlog(id);
      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      return res.json(blog);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/blogs/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const blogs = await storage.getBlogsByUser(userId);
      return res.json(blogs);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/blogs/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const blogs = await storage.getBlogsByCategory(category);
      return res.json(blogs);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/blogs", async (req, res) => {
    try {
      const blogData = insertBlogSchema.parse(req.body);
      const blog = await storage.createBlog(blogData);
      return res.status(201).json(blog);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.put("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const blogData = req.body;
      const blog = await storage.updateBlog(id, blogData);
      return res.json(blog);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/blogs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlog(id);
      if (!success) {
        return res.status(404).json({ message: "Blog not found" });
      }
      return res.json({ success: true });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Like routes
  app.get("/api/likes/blog/:blogId", async (req, res) => {
    try {
      const blogId = parseInt(req.params.blogId);
      const likes = await storage.getLikesByBlog(blogId);
      return res.json(likes);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/likes/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const likes = await storage.getLikesByUser(userId);
      return res.json(likes);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/likes", async (req, res) => {
    try {
      const likeData = insertLikeSchema.parse(req.body);
      // Check if like already exists
      const existingLike = await storage.getLike(likeData.userId, likeData.blogId);
      if (existingLike) {
        return res.status(409).json({ message: "Like already exists" });
      }
      const like = await storage.createLike(likeData);
      return res.status(201).json(like);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/likes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLike(id);
      if (!success) {
        return res.status(404).json({ message: "Like not found" });
      }
      return res.json({ success: true });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Follower routes
  app.get("/api/followers/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const followers = await storage.getFollowers(userId);
      return res.json(followers);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/following/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const following = await storage.getFollowing(userId);
      return res.json(following);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/followers", async (req, res) => {
    try {
      const followerData = insertFollowerSchema.parse(req.body);
      // Check if follower relationship already exists
      const existingFollower = await storage.getFollower(
        followerData.followerId, 
        followerData.followingId
      );
      if (existingFollower) {
        return res.status(409).json({ message: "Already following this user" });
      }
      const follower = await storage.createFollower(followerData);
      return res.status(201).json(follower);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/followers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFollower(id);
      if (!success) {
        return res.status(404).json({ message: "Follower relationship not found" });
      }
      return res.json({ success: true });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Comment routes
  app.get("/api/comments/blog/:blogId", async (req, res) => {
    try {
      const blogId = parseInt(req.params.blogId);
      const comments = await storage.getCommentsByBlog(blogId);
      return res.json(comments);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/comments/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const comments = await storage.getCommentsByUser(userId);
      return res.json(comments);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      return res.status(201).json(comment);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.put("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const commentData = req.body;
      const comment = await storage.updateComment(id, commentData);
      return res.json(comment);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      return res.json({ success: true });
    } catch (err) {
      return handleError(err, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
