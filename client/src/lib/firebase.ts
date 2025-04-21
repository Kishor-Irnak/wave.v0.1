import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const registerWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  return signInWithPopup(auth, googleProvider);
};

export const logout = async () => {
  return signOut(auth);
};

export const updateUserProfile = async (displayName?: string, photoURL?: string) => {
  if (!auth.currentUser) throw new Error("No authenticated user");
  return updateProfile(auth.currentUser, { displayName, photoURL });
};

// Firestore helper functions
export const createDocument = async (collectionName: string, docId: string, data: any) => {
  return setDoc(doc(db, collectionName, docId), {
    ...data,
    createdAt: Timestamp.now()
  });
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  return updateDoc(doc(db, collectionName, docId), {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const getDocument = async (collectionName: string, docId: string) => {
  const docSnap = await getDoc(doc(db, collectionName, docId));
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const queryDocuments = async (
  collectionName: string, 
  conditions: { field: string; op: '==' | '>' | '<' | '>=' | '<='; value: any }[] = [],
  orderByField = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount = 100
) => {
  let q = collection(db, collectionName);
  let queryConstraints = [];

  if (conditions.length > 0) {
    for (const condition of conditions) {
      queryConstraints.push(where(condition.field, condition.op, condition.value));
    }
  }

  queryConstraints.push(orderBy(orderByField, orderDirection));
  
  if (limitCount > 0) {
    queryConstraints.push(limit(limitCount));
  }

  const querySnapshot = await getDocs(query(q, ...queryConstraints));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  return deleteDoc(doc(db, collectionName, docId));
};

// Storage functions
export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log("Starting upload to path:", path);
    console.log("File details:", { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    });

    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          
          let errorMessage = "Upload failed: ";
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage += "User doesn't have permission to access the object.";
              break;
            case 'storage/canceled':
              errorMessage += "User canceled the upload.";
              break;
            case 'storage/unknown':
              errorMessage += "Unknown error occurred, inspect error.serverResponse.";
              break;
            default:
              errorMessage += error.message;
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          try {
            console.log("Upload completed, getting download URL");
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL:", downloadURL);
            resolve(downloadURL);
          } catch (urlError) {
            console.error("Error getting download URL:", urlError);
            reject(urlError);
          }
        }
      );
    } catch (error) {
      console.error("Upload setup error:", error);
      reject(error);
    }
  });
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  return deleteObject(storageRef);
};

// Export firebase instances
export { app, auth, db, storage, FirebaseUser };

// Export firebase types
export type { Timestamp, DocumentData, QueryDocumentSnapshot };
