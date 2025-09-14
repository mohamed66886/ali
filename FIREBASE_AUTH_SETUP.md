# إعداد Firebase Authentication

## الخطوات المطلوبة لتفعيل تسجيل الدخول:

### 1. إعداد Firebase Console:
1. ادخل إلى [Firebase Console](https://console.firebase.google.com)
2. افتح مشروع `alipk-da772`
3. انتقل إلى **Authentication** من القائمة الجانبية
4. اضغط على **Get started**
5. انتقل إلى تبويب **Sign-in method**
6. فعّل **Email/Password** كوسيلة تسجيل دخول

### 2. إنشاء حسابات المستخدمين:
1. انتقل إلى تبويب **Users** في Authentication
2. اضغط على **Add user**
3. أدخل البريد الإلكتروني وكلمة المرور
4. اضغط **Add user**

### 3. قواعد الأمان (Security Rules):
تأكد من إعداد قواعد الأمان المناسبة لـ Firestore إذا كنت تستخدمه:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // قم بتخصيص القواعد حسب احتياجاتك
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. كيفية الاستخدام:
- بعد إنشاء حساب في Firebase، استخدم نفس البريد الإلكتروني وكلمة المرور في صفحة تسجيل الدخول
- سيتم حفظ حالة تسجيل الدخول تلقائياً
- يمكن تسجيل الخروج باستخدام زر الخروج في الشريط العلوي

### 5. ملاحظات مهمة:
- تم تكوين Firebase config في `src/lib/firebase.ts`
- خدمات المصادقة موجودة في `src/lib/authService.ts`
- حالة المصادقة تُدار عبر `src/contexts/AuthContext.tsx`

### 6. ميزات النظام:
- ✅ تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
- ✅ تسجيل الخروج
- ✅ حفظ حالة تسجيل الدخول تلقائياً
- ✅ حماية الصفحات من الوصول غير المصرح به
- ✅ واجهة مستخدم عربية جميلة ومتجاوبة
- ✅ رسائل خطأ ونجاح واضحة

### 7. المتطلبات التقنية:
- Firebase SDK v12.2.1
- React 18+
- TypeScript
- Tailwind CSS

### 8. استكشاف الأخطاء:
إذا واجهت مشاكل في تسجيل الدخول:
1. تأكد من تفعيل Email/Password في Firebase Console
2. تأكد من صحة البريد الإلكتروني وكلمة المرور
3. تحقق من إعدادات الشبكة والـ API Keys
4. راجع console الخاص بالمتصفح للأخطاء
