import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  AuthError
} from "firebase/auth";
import { auth } from "./firebase";

// تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { user: null, error: authError.message };
  }
};

// تسجيل الخروج
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    const authError = error as AuthError;
    return { error: authError.message };
  }
};

// مراقبة تغيير حالة المصادقة
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// الحصول على المستخدم الحالي
export const getCurrentUser = () => {
  return auth.currentUser;
};
