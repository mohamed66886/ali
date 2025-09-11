import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaUsers, FaUserTie, FaChartBar, FaPlus, FaSearch } from 'react-icons/fa';
import { MdLocationCity, MdPlace, MdInfoOutline } from 'react-icons/md';
import { IoClose } from 'react-icons/io5';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { campaignData, getCenterStats, type Center, type LocalUnit, type Village } from '@/data/campaignData';
import StatsChart from './StatsChart';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getOfficialsByVillage, getAllOfficials, type FirebaseOfficial } from '@/lib/firebaseHelpers';

interface SelectedLocation {
  type: 'center' | 'unit' | 'village';
  data: Center | LocalUnit | Village;
  center?: Center;
  unit?: LocalUnit;
}

interface NewOfficial {
  name: string;
  nationalId: string;
  mobile: string;
  notes: string;
}

const InteractiveMap: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [hoveredCenter, setHoveredCenter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOfficial, setNewOfficial] = useState<NewOfficial>({
    name: '',
    nationalId: '',
    mobile: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [villageOfficials, setVillageOfficials] = useState<FirebaseOfficial[]>([]);
  const [isLoadingOfficials, setIsLoadingOfficials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // تحقق من وجود بيانات في قاعدة البيانات عند بداية التطبيق
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const allOfficials = await getAllOfficials();
        console.log('جميع المسؤولين في قاعدة البيانات:', allOfficials);
      } catch (error) {
        console.error('خطأ في جلب جميع المسؤولين:', error);
      }
    };
    
    checkDatabase();
  }, []);

  const handleCenterClick = (center: Center) => {
    setSelectedLocation({ type: 'center', data: center });
  };

  const handleUnitClick = (unit: LocalUnit, center: Center) => {
    setSelectedLocation({ type: 'unit', data: unit, center });
  };

  const handleVillageClick = async (village: Village, center: Center, unit: LocalUnit) => {
    setSelectedLocation({ type: 'village', data: village, center, unit });
    
    console.log('جاري البحث عن المسؤولين في القرية:', village.name);
    setIsLoadingOfficials(true);
    
    try {
      // جلب المسؤولين الخاصين بهذه القرية من Firebase
      const officials = await getOfficialsByVillage(village.name);
      console.log('تم جلب المسؤولين:', officials);
      setVillageOfficials(officials);
    } catch (error) {
      console.error('خطأ في جلب المسؤولين:', error);
      setVillageOfficials([]);
    } finally {
      setIsLoadingOfficials(false);
    }
  };

  const handleAddOfficial = async () => {
    if (!selectedLocation || selectedLocation.type !== 'village') return;
    
    setIsLoading(true);
    try {
      const village = selectedLocation.data as Village;
      const center = selectedLocation.center!;
      const unit = selectedLocation.unit!;
      
      // إضافة المسؤول الجديد إلى Firebase
      const officialData = {
        ...newOfficial,
        villageName: village.name,
        unitName: unit.name,
        centerId: center.id,
        centerName: center.name,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'officials'), officialData);
      
      console.log('تم إضافة المسؤول بنجاح بالمعرف:', docRef.id);
      console.log('بيانات المسؤول المضاف:', officialData);
      
      // إعادة تعيين النموذج
      setNewOfficial({
        name: '',
        nationalId: '',
        mobile: '',
        notes: ''
      });
      
      // إغلاق الـ modal
      setIsDialogOpen(false);
      
      // يمكنك إضافة رسالة نجاح هنا
      alert('تم إضافة المسؤول بنجاح!');
      
      // إعادة جلب المسؤولين بعد الإضافة
      if (selectedLocation && selectedLocation.type === 'village') {
        const village = selectedLocation.data as Village;
        console.log('إعادة جلب المسؤولين بعد الإضافة للقرية:', village.name);
        setIsLoadingOfficials(true);
        try {
          const officials = await getOfficialsByVillage(village.name);
          console.log('المسؤولين بعد الإضافة:', officials);
          setVillageOfficials(officials);
        } catch (error) {
          console.error('خطأ في إعادة جلب المسؤولين:', error);
        } finally {
          setIsLoadingOfficials(false);
        }
      }
      
    } catch (error) {
      console.error('خطأ في إضافة المسؤول:', error);
      alert('حدث خطأ أثناء إضافة المسؤول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewOfficial, value: string) => {
    setNewOfficial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredCenters = campaignData.filter(center =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.localUnits.some(unit => 
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.villages.some(village => 
        village.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  const renderLocationDetails = () => {
    if (!selectedLocation) return null;
    const { type, data } = selectedLocation;
    if (type === 'center') {
      const center = data as Center;
      const stats = getCenterStats(center.id);
      return (
        <Card className="w-full max-w-xs sm:max-w-md mx-auto shadow-lg" style={{ border: 'none' }}>
          <CardHeader className="text-center p-4 rounded-t-lg" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
            <CardTitle className="flex items-center justify-center gap-2 text-xl" style={{ color: '#3b82f6' }}>
              <MdLocationCity className="w-6 h-6" style={{ color: '#3b82f6' }} />
              مركز {center.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <FaUsers className="w-6 h-6 mx-auto" style={{ color: '#3b82f6' }} />
                <div className="font-bold text-lg">{stats?.population.toLocaleString()}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>نسمة</div>
              </div>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <FaUserTie className="w-6 h-6 mx-auto" style={{ color: '#059669' }} />
                <div className="font-bold text-lg">{stats?.officials}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>مسؤول</div>
              </div>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <MdPlace className="w-6 h-6 mx-auto" style={{ color: '#dc2626' }} />
                <div className="font-bold text-lg">{stats?.villages}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>قرية</div>
              </div>
            </div>
            <StatsChart type="center" data={center} />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MdInfoOutline style={{ color: '#6b7280' }} />
                الوحدات المحلية:
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {center.localUnits.map((unit, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-between py-3 px-4 rounded-lg transition-all"
                    style={{ 
                      border: '1px solid #e5e7eb'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#dbeafe'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                    onClick={() => handleUnitClick(unit, center)}
                  >
                    <span>{unit.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {unit.villages.length} قرى
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (type === 'unit') {
      const unit = data as LocalUnit;
      const center = selectedLocation.center!;
      return (
        <Card className="w-full max-w-xs sm:max-w-md mx-auto shadow-lg" style={{ border: 'none' }}>
          <CardHeader className="text-center p-4 rounded-t-lg" style={{ background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))' }}>
            <CardTitle className="text-lg">{unit.name}</CardTitle>
            <Badge variant="secondary" className="text-sm w-fit mx-auto">{center.name}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <FaUsers className="w-5 h-5 mx-auto" style={{ color: '#3b82f6' }} />
                <div className="font-bold text-lg">{unit.villages.reduce((sum, v) => sum + v.population, 0).toLocaleString()}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>نسمة</div>
              </div>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <MdPlace className="w-5 h-5 mx-auto" style={{ color: '#dc2626' }} />
                <div className="font-bold text-lg">{unit.villages.length}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>قرية</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <MdInfoOutline style={{ color: '#6b7280' }} />
                القرى التابعة:
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {unit.villages.map((village, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-between py-2 px-3 rounded-lg transition-all hover:bg-gray-100"
                    onClick={() => handleVillageClick(village, center, unit)}
                  >
                    <span className="text-sm">{village.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {village.population.toLocaleString()}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (type === 'village') {
      const village = data as Village;
      return (
        <Card className="w-full max-w-xs sm:max-w-md mx-auto shadow-lg" style={{ border: 'none' }}>
          <CardHeader className="text-center p-4 rounded-t-lg" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
            <CardTitle className="text-lg">{village.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <FaUsers className="w-5 h-5 mx-auto" style={{ color: '#3b82f6' }} />
                <div className="font-bold text-lg">{village.population.toLocaleString()}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>نسمة</div>
              </div>
              <div className="space-y-2 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>
                <FaUserTie className="w-5 h-5 mx-auto" style={{ color: '#059669' }} />
                <div className="font-bold text-lg">{villageOfficials.length}</div>
                <div className="text-xs" style={{ color: '#6b7280' }}>مسؤول</div>
              </div>
            </div>
            <StatsChart type="village" data={village} />
            
            {/* قائمة المسؤولين */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FaUserTie style={{ color: '#6b7280' }} />
                  المسؤولين:
                </h4>
                <span className="text-xs" style={{ color: '#6b7280' }}>{villageOfficials.length} مسؤول</span>
              </div>
              
              {isLoadingOfficials ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#3b82f6' }}></div>
                  <p className="text-xs mt-2" style={{ color: '#6b7280' }}>جاري تحميل المسؤولين...</p>
                </div>
              ) : villageOfficials.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {villageOfficials.map((official) => (
                    <div key={official.id} className="rounded-lg p-3 text-sm transition-all hover:bg-gray-100" style={{ background: '#e5e7eb' }}>
                      <div className="font-medium flex items-center justify-between">
                        <span>{official.name}</span>
                        <Badge variant="outline" className="text-xs">مسؤول</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1" style={{ color: '#6b7280' }}>
                        <span>📱</span>
                        <span>{official.mobile}</span>
                      </div>
                      {official.notes && (
                        <div className="mt-2 flex items-start gap-1 text-xs" style={{ color: '#6b7280' }}>
                          <span>💬</span>
                          <span>{official.notes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 rounded-lg" style={{ background: '#f3f4f6' }}>
                  <p className="text-sm" style={{ color: '#6b7280' }}>لا يوجد مسؤولين مسجلين في هذه القرية</p>
                </div>
              )}
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="w-full text-sm py-3 gap-2">
                  <FaPlus className="w-4 h-4" />
                  إضافة مسؤول جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white shadow-xl rounded-lg p-0 overflow-hidden" style={{ border: 'none' }} dir="rtl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-white/90 to-green-50/80 -z-10"></div>
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <DialogTitle className="text-center text-xl font-bold">إضافة مسؤول جديد</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 p-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-right font-semibold text-foreground text-sm">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={newOfficial.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="أدخل الاسم الكامل"
                      className="text-right bg-white text-sm py-2"
                      style={{ border: '2px solid #e5e7eb' }}
                      minLength={2}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nationalId" className="text-right font-semibold text-foreground text-sm">
                      الرقم القومي
                    </Label>
                    <Input
                      id="nationalId"
                      type="text"
                      value={newOfficial.nationalId}
                      onChange={(e) => handleInputChange('nationalId', e.target.value)}
                      placeholder="أدخل الرقم القومي (14 رقم)"
                      className="text-right bg-white text-sm py-2"
                      style={{ border: '2px solid #e5e7eb' }}
                      maxLength={14}
                      minLength={14}
                      pattern="[0-9]{14}"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mobile" className="text-right font-semibold text-foreground text-sm">
                      رقم الموبايل
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={newOfficial.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value)}
                      placeholder="أدخل رقم الموبايل (01xxxxxxxxx)"
                      className="text-right bg-white text-sm py-2"
                      style={{ border: '2px solid #e5e7eb' }}
                      maxLength={11}
                      minLength={11}
                      pattern="01[0-2,5][0-9]{8}"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-right font-semibold text-foreground text-sm">
                      ملاحظات
                    </Label>
                    <Textarea
                      id="notes"
                      value={newOfficial.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="أدخل أي ملاحظات إضافية (اختياري)"
                      className="text-right bg-white text-sm min-h-[80px]"
                      style={{ border: '2px solid #e5e7eb' }}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 pt-0">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)} 
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <IoClose className="w-4 h-4" />
                    إلغاء
                  </Button>
                  <Button 
                    onClick={handleAddOfficial}
                    disabled={!newOfficial.name || !newOfficial.nationalId || !newOfficial.mobile || isLoading}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الإضافة...
                      </>
                    ) : (
                      <>
                        <FaPlus className="w-4 h-4" />
                        إضافة
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f9fafb, #ffffff)' }}>
      <div className="mx-auto max-w-7xl">
        {/* العنوان الرئيسي */}
        <motion.div
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            خريطة الدائرة الانتخابية
          </h1>
          <p className="text-base sm:text-lg" style={{ color: '#6b7280' }}>
            دكرنس • بني عبيد • شربين
          </p>
        </motion.div>

        {/* شريط البحث */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="relative">
            <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280' }} />
            <Input
              type="text"
              placeholder="ابحث عن مركز أو وحدة أو قرية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-right border-2 border-gray-300 focus:border-blue-400 focus:ring-0 bg-white shadow-sm rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الخريطة التفاعلية */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: '#1f2937' }}>
                <FaMapMarkerAlt className="w-5 h-5" style={{ color: '#3b82f6' }} />
                الخريطة التفاعلية للدائرة الانتخابية
              </h2>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                اضغط على أي مركز لعرض التفاصيل والإحصائيات الخاصة به
              </p>
            </div>
            <Card className="p-4 sm:p-6 min-h-[500px] shadow-lg" style={{ border: '1px solid #e5e7eb' }}>
              <div className="relative w-full h-full">
                {/* خلفية الخريطة المحسنة */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 rounded-lg" style={{ border: '1px solid #dbeafe' }}>
                  {/* شبكة الخلفية */}
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" className="w-full h-full">
                      <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#059669" strokeWidth="0.5" opacity="0.3"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  {/* خريطة مصر كخلفية */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg width="300" height="200" viewBox="0 0 300 200" style={{ color: '#3b82f6' }}>
                      <path d="M50 50 L200 50 L250 80 L230 150 L80 160 L50 120 Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                {/* المراكز على الخريطة */}
                <div className="relative w-full h-full">
                  {filteredCenters.map((center, index) => (
                    <motion.div
                      key={center.id}
                      className={`absolute cursor-pointer group`}
                      style={{
                        top: `${25 + index * 25}%`,
                        right: `${20 + index * 20}%`,
                      }}
                      whileHover={{ scale: 1.1 }}
                      onMouseEnter={() => setHoveredCenter(center.id)}
                      onMouseLeave={() => setHoveredCenter(null)}
                      onClick={() => handleCenterClick(center)}
                    >
                      <motion.div
                        className={`relative p-4 rounded-xl shadow-lg transition-all duration-500 ${
                          hoveredCenter === center.id 
                            ? 'scale-110 shadow-xl transform rotate-1' 
                            : 'hover:shadow-xl'
                        }`}
                        style={{
                          background: hoveredCenter === center.id 
                            ? 'linear-gradient(to bottom right, #3b82f6, #2563eb)' 
                            : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(4px)',
                          border: hoveredCenter === center.id ? '2px solid white' : '2px solid #dbeafe'
                        }}
                        animate={{
                          y: hoveredCenter === center.id ? -4 : 0,
                          rotate: hoveredCenter === center.id ? 2 : 0,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut"
                        }}
                      >
                        <div className="text-center relative z-10">
                          <motion.div
                            animate={{
                              scale: hoveredCenter === center.id ? [1, 1.2, 1] : 1,
                            }}
                            transition={{
                              duration: 0.5,
                              repeat: hoveredCenter === center.id ? Infinity : 0,
                              ease: "easeInOut"
                            }}
                          >
                            <FaMapMarkerAlt 
                              className="w-8 h-8 mx-auto mb-2 drop-shadow-lg"
                              style={{ 
                                color: hoveredCenter === center.id ? 'white' : '#3b82f6' 
                              }}
                            />
                          </motion.div>
                          <h3 className="font-bold text-base mb-1"
                              style={{ 
                                color: hoveredCenter === center.id ? 'white' : '#1f2937' 
                              }}>
                            مركز {center.name}
                          </h3>
                          <div className="text-sm font-medium"
                               style={{ 
                                 color: hoveredCenter === center.id ? 'rgba(255,255,255,0.9)' : '#6b7280' 
                               }}>
                            {getCenterStats(center.id)?.villages} قرية
                          </div>
                          <div className="text-xs mt-1"
                               style={{ 
                                 color: hoveredCenter === center.id ? 'rgba(255,255,255,0.8)' : '#3b82f6' 
                               }}>
                            {getCenterStats(center.id)?.population.toLocaleString()} نسمة
                          </div>
                        </div>
                        {/* مؤشر النشاط المحسن */}
                        <motion.div
                          className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-full shadow-lg"
                          style={{ border: '2px solid white' }}
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.8, 1, 0.8],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        />
                        {/* تأثير الإضاءة */}
                        {hoveredCenter === center.id && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </motion.div>
                      {/* خطوط الربط المحسنة */}
                      {index < filteredCenters.length - 1 && (
                        <svg className="absolute top-full left-1/2 w-20 h-12 -translate-x-1/2 pointer-events-none">
                          <motion.path
                            d="M8 0 Q10 5 16 10"
                            stroke="url(#lineGradient)"
                            strokeWidth="2"
                            fill="none"
                            className="drop-shadow-sm"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.7 }}
                            transition={{ delay: index * 0.5, duration: 1.5, ease: "easeOut" }}
                          />
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#059669" stopOpacity="0.8"/>
                              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          {/* بيانات المنطقة المختارة */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedLocation ? (
                <motion.div
                  key={selectedLocation.type + selectedLocation.data.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderLocationDetails()}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center p-8 rounded-lg" 
                  style={{ 
                    background: '#f3f4f6', 
                    border: '2px dashed #d1d5db' 
                  }}
                >
                  <FaChartBar className="w-12 h-12 mx-auto mb-4" style={{ color: '#6b7280' }} />
                  <h3 className="text-lg font-semibold mb-2">اختر منطقة من الخريطة</h3>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    اضغط على أي مركز لعرض التفاصيل والإحصائيات
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;