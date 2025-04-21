import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  auth, 
  loginWithEmail, 
  loginWithGoogle, 
  registerWithEmail, 
  logout, 
  updateUserProfile, 
  createDocument,
  getDocument
} from "@/lib/firebase";
import type { FirebaseUser } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user from our database
          const response = await apiRequest("GET", `/api/users/uid/${firebaseUser.uid}`);
          const userData = await response.json();
          setDbUser(userData);
        } catch (error) {
          console.error("Failed to get user data:", error);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log("Starting Google login process");
      const result = await loginWithGoogle();
      const user = result.user;
      console.log("Google login successful", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      // Check if the user exists in our database
      try {
        console.log("Checking if user exists in Firestore");
        const existingUser = await getDocument('users', user.uid);
        console.log("Firestore user check result:", existingUser);
        
        if (!existingUser) {
          console.log("Creating new user in Firestore");
          // Generate a username from email or display name
          const baseUsername = (user.displayName || user.email?.split('@')[0] || `user_${Date.now()}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
          const username = `${baseUsername}_${Date.now().toString().substr(-4)}`;
          
          // Create user in Firestore
          await createDocument('users', user.uid, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || username,
            photoURL: user.photoURL,
            username: username,
          });
          
          // Create user in our API
          console.log("Creating user in API database");
          const newUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || username, 
            username: username,
            photoURL: user.photoURL
          };
          
          const response = await apiRequest("POST", "/api/users", newUser);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error("API error response during user creation:", errorData);
            throw new Error(errorData?.message || `API error: ${response.status}`);
          }
          
          const createdUser = await response.json();
          console.log("User created successfully in API:", createdUser);
        }
      } catch (error) {
        console.error("Error during user creation:", error);
        // Don't throw the error - we still want the user to be logged in even if the database creation fails
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      console.log("Starting email registration process", { email, username });
      const result = await registerWithEmail(email, password);
      const user = result.user;
      console.log("Firebase registration successful", { uid: user.uid });
      
      try {
        // Update display name
        console.log("Updating user profile with display name:", username);
        await updateUserProfile(username);
        
        // Create user in Firestore
        console.log("Creating user in Firestore");
        await createDocument('users', user.uid, {
          uid: user.uid,
          email,
          displayName: username,
          username,
          photoURL: null,
        });
        
        // Create user in our API
        console.log("Creating user in API database");
        const newUser = {
          uid: user.uid,
          email,
          displayName: username,
          username,
          photoURL: null
        };
        
        const response = await apiRequest("POST", "/api/users", newUser);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("API error response during user creation:", errorData);
          throw new Error(errorData?.message || `API error: ${response.status}`);
        }
        
        const createdUser = await response.json();
        console.log("User created successfully in API:", createdUser);
      } catch (error) {
        console.error("Error during user setup after registration:", error);
        // We don't throw here to avoid interrupting the user flow
        // The user is already registered in Firebase, they can retry other operations later
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error; // Rethrow to allow the UI to show the error
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logout();
      queryClient.clear();
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (displayName?: string, photoURL?: string) => {
    if (!user) throw new Error("No authenticated user");
    
    setLoading(true);
    try {
      await updateUserProfile(displayName, photoURL);
      
      // Update user in our database
      if (dbUser) {
        const updates: any = {};
        if (displayName) updates.displayName = displayName;
        if (photoURL) updates.photoURL = photoURL;
        
        await apiRequest("PUT", `/api/users/${dbUser.id}`, updates);
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: [`/api/users/uid/${user.uid}`] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        login,
        loginWithGoogle: signInWithGoogle,
        register,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
