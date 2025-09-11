import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import campaignHero from '@/assets/campaign-hero.jpg';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* خلفية الصورة */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${campaignHero})` }}
      />
      
      {/* طبقة التدرج */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-secondary/90" />

      <div className="relative text-center space-y-8 px-6">
        {/* شعار الحملة */}
        <motion.div 
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="w-32 h-32 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-glow">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-medium">
              <div className="text-primary text-2xl font-bold">علي</div>
            </div>
          </div>
          <motion.div 
            className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full border-2 border-white"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* اسم المرشح */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            المهندس علي البيلي
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium">
            حملة انتخابية - دكرنس • بني عبيد • شربين
          </p>
        </motion.div>

        {/* شريط التحميل */}
        <motion.div
          className="w-80 max-w-sm mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="relative">
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
              <motion.div 
                className="h-full bg-gradient-accent rounded-full shadow-glow"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="mt-4 text-white/90 text-sm font-medium">
              جاري تحميل منصة إدارة الحملة... {progress}%
            </div>
          </div>
        </motion.div>

        {/* رسائل تحفيزية */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="text-white/80 text-sm font-medium"
        >
          {progress < 30 && "جاري تحميل بيانات المراكز..."}
          {progress >= 30 && progress < 60 && "جاري إعداد الخريطة التفاعلية..."}
          {progress >= 60 && progress < 90 && "جاري تحميل إحصائيات الحملة..."}
          {progress >= 90 && "اكتمل التحميل... مرحباً بك"}
        </motion.div>

        {/* العناصر المتحركة في الخلفية */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                opacity: 0
              }}
              animate={{ 
                y: [null, -100],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;