import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import type { Official } from '@/data/campaignData';

// نوع البيانات المحفوظة في Firebase
export interface FirebaseOfficial {
  id: string;
  name: string;
  nationalId: string;
  mobile: string;
  notes: string;
  villageName: string;
  unitName: string;
  centerId: string;
  centerName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// جلب جميع المسؤولين
export const getAllOfficials = async (): Promise<FirebaseOfficial[]> => {
  try {
    console.log('جلب جميع المسؤولين من قاعدة البيانات...');
    
    let querySnapshot;
    
    try {
      // جرب مع orderBy أولاً
      const q = query(
        collection(db, 'officials'), 
        orderBy('createdAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      console.log('فشل الاستعلام مع الترتيب، جاري المحاولة بدون ترتيب:', orderError);
      // إذا فشل، جرب بدون orderBy
      querySnapshot = await getDocs(collection(db, 'officials'));
    }
    
    console.log('عدد المسؤولين الكلي:', querySnapshot.docs.length);
    
    const officials = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseOfficial));
    
    // ترتيب النتائج يدوياً
    officials.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0;
    });
    
    return officials;
  } catch (error) {
    console.error('خطأ في جلب المسؤولين:', error);
    return [];
  }
};

// جلب المسؤولين حسب القرية
export const getOfficialsByVillage = async (villageName: string): Promise<FirebaseOfficial[]> => {
  try {
    console.log('البحث عن المسؤولين في القرية:', villageName);
    
    // أولاً جرب بدون orderBy في حالة عدم وجود index
    let q = query(
      collection(db, 'officials'),
      where('villageName', '==', villageName)
    );
    
    console.log('تنفيذ الاستعلام بدون ترتيب...');
    let querySnapshot;
    
    try {
      // جرب مع orderBy أولاً
      q = query(
        collection(db, 'officials'),
        where('villageName', '==', villageName),
        orderBy('createdAt', 'desc')
      );
      querySnapshot = await getDocs(q);
    } catch (orderError) {
      console.log('فشل الاستعلام مع الترتيب، جاري المحاولة بدون ترتيب:', orderError);
      // إذا فشل، جرب بدون orderBy
      q = query(
        collection(db, 'officials'),
        where('villageName', '==', villageName)
      );
      querySnapshot = await getDocs(q);
    }
    
    console.log('عدد النتائج:', querySnapshot.docs.length);
    
    const officials = querySnapshot.docs.map(doc => {
      const data = {
        id: doc.id,
        ...doc.data()
      } as FirebaseOfficial;
      console.log('مسؤول تم جلبه:', data);
      return data;
    });
    
    // ترتيب النتائج يدوياً إذا كان هناك بيانات
    officials.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0;
    });
    
    return officials;
  } catch (error) {
    console.error('خطأ في جلب مسؤولي القرية:', error);
    return [];
  }
};

// جلب المسؤولين حسب المركز
export const getOfficialsByCenter = async (centerId: string): Promise<FirebaseOfficial[]> => {
  try {
    const q = query(
      collection(db, 'officials'),
      where('centerId', '==', centerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseOfficial));
  } catch (error) {
    console.error('خطأ في جلب مسؤولي المركز:', error);
    return [];
  }
};

// جلب المسؤولين حسب الوحدة المحلية
export const getOfficialsByUnit = async (unitName: string): Promise<FirebaseOfficial[]> => {
  try {
    const q = query(
      collection(db, 'officials'),
      where('unitName', '==', unitName),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseOfficial));
  } catch (error) {
    console.error('خطأ في جلب مسؤولي الوحدة:', error);
    return [];
  }
};
