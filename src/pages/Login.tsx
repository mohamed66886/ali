import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useToast } from '@/components/ui/use-toast';
import { signInWithEmail } from '@/lib/authService';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { user, error } = await signInWithEmail(email, password);

    if (user) {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم",
      });
      login(user);
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error || "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div 
              className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <FaUser className="text-white text-2xl" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                المهندس علي البيلي
              </CardTitle>
              <p className="text-primary font-semibold mt-2">
                لوحة التحكم - الحملة الانتخابية
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-right block">
                  البريد الإلكتروني
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 text-right"
                    placeholder="أدخل البريد الإلكتروني"
                    required
                  />
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 text-right"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3"
                disabled={isLoading}
              >
                {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>استخدم البريد الإلكتروني وكلمة المرور المسجلين في Firebase</p>
              <p className="mt-1 text-primary font-semibold">
                تأكد من إنشاء حساب في Firebase Authentication أولاً
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
