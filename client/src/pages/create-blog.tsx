import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBlogSchema } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Editor } from "@/components/ui/editor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadFile } from "@/lib/firebase";

export default function CreateBlog() {
  const [location, navigate] = useLocation();
  const { user, dbUser } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if not logged in
  if (!user) {
    navigate("/login");
    return null;
  }

  const form = useForm({
    resolver: zodResolver(createBlogSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: "",
      coverImage: "",
    },
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const filePath = `blogs/${user.uid}/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, filePath, (progress) => {
        setUploadProgress(progress);
      });
      setIsUploading(false);
      return url;
    } catch (error) {
      console.error("Image upload error:", error);
      setIsUploading(false);
      throw error;
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      // Display file info for debugging
      console.log("Uploading file:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      const filePath = `covers/${user.uid}/${Date.now()}_${file.name}`;
      console.log("Upload path:", filePath);
      
      const url = await uploadFile(file, filePath, (progress) => {
        console.log("Upload progress:", progress);
        setUploadProgress(progress);
      });
      
      console.log("Upload successful, URL:", url);
      form.setValue("coverImage", url);
      toast({
        title: "Cover image uploaded",
        description: "Your cover image has been uploaded successfully."
      });
    } catch (error) {
      console.error("Cover image upload error:", error);
      // More detailed error message
      let errorMessage = "Failed to upload cover image. ";
      
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: any) => {
    if (!dbUser) {
      toast({
        title: "User data not found",
        description: "Please try again or log out and log back in.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Submitting form data:", data);
    
    try {
      // Validate required fields
      if (!data.title) {
        toast({
          title: "Missing title",
          description: "Please enter a title for your blog post.",
          variant: "destructive"
        });
        return;
      }
      
      if (!data.content) {
        toast({
          title: "Missing content",
          description: "Please enter content for your blog post.",
          variant: "destructive"
        });
        return;
      }
      
      if (!data.category) {
        toast({
          title: "Missing category",
          description: "Please select a category for your blog post.",
          variant: "destructive"
        });
        return;
      }
      
      // Process tags
      let tagsArray = [];
      if (data.tags) {
        tagsArray = data.tags.split(",").map((tag: string) => tag.trim());
      }
      
      // Create blog post
      const blogData = {
        userId: dbUser.id,
        title: data.title,
        content: data.content,
        coverImage: data.coverImage || null,
        category: data.category,
        tags: tagsArray,
        publishedAt: new Date().toISOString()
      };
      
      console.log("Submitting blog data to API:", blogData);
      
      const response = await apiRequest("POST", "/api/blogs", blogData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("API error response:", errorData);
        throw new Error(errorData?.message || `API error: ${response.status}`);
      }
      
      const createdBlog = await response.json();
      console.log("Blog created successfully:", createdBlog);
      
      toast({
        title: "Blog published!",
        description: "Your blog post has been published successfully."
      });
      
      navigate(`/blog/${createdBlog.id}`);
    } catch (error) {
      console.error("Error creating blog:", error);
      
      let errorMessage = "An error occurred while publishing your blog post. ";
      if (error instanceof Error) {
        errorMessage += error.message;
      }
      
      toast({
        title: "Failed to publish blog",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Blog Post</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a catchy title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Science">Science</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            {field.value ? (
                              <div className="space-y-2">
                                <img 
                                  src={field.value} 
                                  alt="Cover preview" 
                                  className="mx-auto h-40 object-cover rounded-md"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => form.setValue("coverImage", "")}
                                  className="w-full"
                                >
                                  Change Image
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      onChange={handleCoverImageUpload}
                                      accept="image/*"
                                      disabled={isUploading}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                
                                {isUploading && (
                                  <div className="w-full mt-2">
                                    <div className="bg-gray-200 rounded-full h-2.5">
                                      <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${uploadProgress}%` }}
                                      ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-center">
                                      {Math.round(uploadProgress)}% uploaded
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Editor
                            value={field.value}
                            onChange={field.onChange}
                            onImageUpload={handleImageUpload}
                            minHeight="400px"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="technology, webdev, programming..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Separate tags with commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline">
                      Save as Draft
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      Publish
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
