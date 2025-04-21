import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadFile } from "@/lib/firebase";

// Define form schema
const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username cannot exceed 20 characters"),
  bio: z.string().max(160, "Bio cannot exceed 160 characters").optional(),
  location: z.string().max(50, "Location cannot exceed 50 characters").optional(),
  website: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
});

export default function EditProfile() {
  const [_, navigate] = useLocation();
  const { user, dbUser, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if not logged in
  if (!user || !dbUser) {
    navigate("/login");
    return null;
  }

  // Initialize form with user data
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: dbUser.displayName || "",
      username: dbUser.username || "",
      bio: dbUser.bio || "",
      location: dbUser.location || "",
      website: dbUser.website || "",
    },
  });

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const filePath = `profiles/${user.uid}/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, filePath, (progress) => {
        setUploadProgress(progress);
      });
      
      // Update Firebase auth profile
      await updateProfile(undefined, url);
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Update user profile in our API
      await apiRequest("PUT", `/api/users/${dbUser.id}`, data);
      
      // Update Firebase auth display name if it changed
      if (data.displayName !== dbUser.displayName) {
        await updateProfile(data.displayName);
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
      
      // Navigate to profile page
      navigate(`/profile/${data.username}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile. Please try again.",
        variant: "destructive"
      });
    }
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
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
              
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Image</h2>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="text-xl">
                      {getInitials(user.displayName || user.email || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <label className="block">
                      <Button asChild variant="outline" disabled={isUploading}>
                        <span>
                          Change profile picture
                          <input
                            type="file"
                            className="sr-only"
                            onChange={handleProfileImageUpload}
                            accept="image/*"
                          />
                        </span>
                      </Button>
                    </label>
                    {isUploading && (
                      <div className="w-full mt-2">
                        <div className="bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(uploadProgress)}% uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Your unique username for your profile URL.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little about yourself"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description for your profile. Maximum 160 characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate(`/profile/${dbUser.username}`)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                      Save changes
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
