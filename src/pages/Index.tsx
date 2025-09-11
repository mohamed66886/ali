import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';
import InteractiveMap from '../components/InteractiveMap';
import Dashboard from '../components/Dashboard';
import { Button } from '@/components/ui/button';
import { FaMap, FaTachometerAlt, FaUser } from 'react-icons/fa';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'map' | 'dashboard'>('map');

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-white pt-12 sm:pt-16 pb-16 sm:pb-0">
      {/* شريط التنقل العلوي */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-border shadow-soft"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-2 sm:px-6 h-12 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.div 
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <FaUser className="text-white text-xs sm:text-sm" />
            </motion.div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">المهندس علي البيلي</h1>
              <p className="text-[10px] sm:text-xs text-primary font-bold leading-tight">الحملة الانتخابية</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={currentView === 'map' ? 'campaign' : 'ghost'}
              size="icon"
              onClick={() => setCurrentView('map')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
            >
              <FaMap />
              <span className="hidden xs:inline">الخريطة</span>
            </Button>
            <Button
              variant={currentView === 'dashboard' ? 'campaign' : 'ghost'}
              size="icon"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
            >
              <FaTachometerAlt />
              <span className="hidden xs:inline">لوحة التحكم</span>
            </Button>
          </nav>
        </div>
      </motion.header>

      {/* المحتوى الرئيسي */}
      <main className="pt-16 sm:pt-20 px-2 sm:px-0">
        <AnimatePresence mode="wait">
          {currentView === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg shadow-sm bg-white p-1 sm:p-4 min-h-[60vh]"
            >
              <InteractiveMap />
            </motion.div>
          )}
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg shadow-sm bg-white p-1 sm:p-4 min-h-[60vh]"
            >
              <Dashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* مؤشر التحميل السفلي */}
      <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="bg-gradient-primary text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-glow text-xs sm:text-sm font-medium">
            مرحباً بك في منصة إدارة الحملة
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
