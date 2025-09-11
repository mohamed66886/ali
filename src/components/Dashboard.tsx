import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaUserTie, FaMapMarkerAlt, FaChartLine, FaPlus, FaEdit, FaTrash, FaDownload, FaCheckCircle, FaExclamationCircle, FaFilePdf, FaFileExcel, FaFileCsv } from 'react-icons/fa';
import { MdDashboard, MdLocationCity, MdWarning, MdTrendingUp, MdPieChart } from 'react-icons/md';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campaignData, getDistrictStats, getCenterStats, type Center, type Village } from '@/data/campaignData';
import { getAllOfficials, type FirebaseOfficial } from '@/lib/firebaseHelpers';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

interface NewOfficial {
  name: string;
  nationalId: string;
  mobile: string;
  notes: string;
  centerId: string;
  centerName: string;
  unitName: string;
  villageName: string;
}

const Dashboard: React.FC = () => {
  const districtStats = getDistrictStats();
  const [firebaseOfficials, setFirebaseOfficials] = useState<FirebaseOfficial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddingOfficial, setIsAddingOfficial] = useState(false);
  const [isUpdatingOfficial, setIsUpdatingOfficial] = useState(false);
  const [isDeletingOfficial, setIsDeletingOfficial] = useState(false);
  const [isExporting, setIsExporting] = useState({
    pdf: false,
    excel: false,
    csv: false,
    detailed: false
  });
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [editingOfficial, setEditingOfficial] = useState<FirebaseOfficial | null>(null);
  const [officialToDelete, setOfficialToDelete] = useState<FirebaseOfficial | null>(null);
  const [newOfficial, setNewOfficial] = useState<NewOfficial>({
    name: '',
    nationalId: '',
    mobile: '',
    notes: '',
    centerId: '',
    centerName: '',
    unitName: '',
    villageName: ''
  });

  // حساب الإحصائيات المفصلة
  const getDetailedStats = () => {
    const stats = {
      centerStats: campaignData.map(center => {
        const centerOfficials = firebaseOfficials.filter(official => official.centerId === center.id);
        const centerStats = getCenterStats(center.id);
        const coverage = centerStats ? (centerOfficials.length / centerStats.villages) * 100 : 0;
        
        return {
          ...center,
          officialsCount: centerOfficials.length,
          population: centerStats?.population || 0,
          villages: centerStats?.villages || 0,
          coverage: Math.round(coverage)
        };
      }),
      villagesWithOfficials: 0,
      villagesWithoutOfficials: 0,
      topCenters: [] as Array<{
        id: string;
        name: string;
        officialsCount: number;
        population: number;
        villages: number;
        coverage: number;
      }>,
      coverageByUnit: [] as Array<{
        centerName: string;
        unitName: string;
        villages: number;
        officials: number;
        coverage: number;
        population: number;
      }>
    };

    // حساب القرى المغطاة وغير المغطاة
    campaignData.forEach(center => {
      center.localUnits.forEach(unit => {
        unit.villages.forEach(village => {
          const hasOfficial = firebaseOfficials.some(
            official => official.villageName === village.name && official.centerId === center.id
          );
          if (hasOfficial) {
            stats.villagesWithOfficials++;
          } else {
            stats.villagesWithoutOfficials++;
          }
        });
      });
    });

    // ترتيب المراكز حسب التغطية
    stats.topCenters = [...stats.centerStats]
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 5);

    // إحصائيات التغطية بالوحدة المحلية
    stats.coverageByUnit = [];
    campaignData.forEach(center => {
      center.localUnits.forEach(unit => {
        const unitVillages = unit.villages.length;
        const unitOfficials = firebaseOfficials.filter(
          official => official.unitName === unit.name && official.centerId === center.id
        ).length;
        const unitCoverage = unitVillages > 0 ? (unitOfficials / unitVillages) * 100 : 0;
        
        stats.coverageByUnit.push({
          centerName: center.name,
          unitName: unit.name,
          villages: unitVillages,
          officials: unitOfficials,
          coverage: Math.round(unitCoverage),
          population: unit.villages.reduce((sum, village) => sum + village.population, 0)
        });
      });
    });

    stats.coverageByUnit.sort((a, b) => b.coverage - a.coverage);

    return stats;
  };

  const detailedStats = getDetailedStats();

  // دوال تصدير التقارير
  const exportToPDF = async () => {
    try {
      setIsExporting(prev => ({ ...prev, pdf: true }));
      
      // إنشاء ملف PDF جديد
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // إعداد الخط العربي (افتراضي)
      pdf.setFont('helvetica', 'normal');
      
      // عنوان التقرير
      pdf.setFontSize(20);
      pdf.text('تقرير شامل - الحملة الانتخابية للمهندس علي البيلي', 105, 20, { align: 'center' });
      
      // التاريخ
      const currentDate = new Date().toLocaleDateString('ar-EG');
      pdf.setFontSize(12);
      pdf.text(`تاريخ التقرير: ${currentDate}`, 20, 35);
      
      // الإحصائيات الرئيسية
      pdf.setFontSize(16);
      pdf.text('الإحصائيات الرئيسية:', 20, 50);
      
      pdf.setFontSize(12);
      let yPosition = 65;
      
      const mainStats = [
        `إجمالي السكان: ${districtStats.totalPopulation.toLocaleString()} نسمة`,
        `إجمالي المسؤولين: ${firebaseOfficials.length} مسؤول`,
        `عدد القرى: ${districtStats.totalVillages} قرية`,
        `القرى المغطاة: ${detailedStats.villagesWithOfficials} قرية`,
        `القرى غير المغطاة: ${detailedStats.villagesWithoutOfficials} قرية`,
        `معدل التغطية العام: ${Math.round((detailedStats.villagesWithOfficials / districtStats.totalVillages) * 100)}%`
      ];
      
      mainStats.forEach(stat => {
        pdf.text(stat, 25, yPosition);
        yPosition += 10;
      });
      
      // أفضل المراكز
      yPosition += 10;
      pdf.setFontSize(16);
      pdf.text('أفضل المراكز في التغطية:', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      detailedStats.topCenters.forEach((center, index) => {
        pdf.text(`${index + 1}. ${center.name}: ${center.coverage}% (${center.officialsCount}/${center.villages})`, 25, yPosition);
        yPosition += 8;
      });
      
      // صفحة جديدة للمسؤولين
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('قائمة المسؤولين:', 20, 20);
      
      yPosition = 35;
      pdf.setFontSize(10);
      
      firebaseOfficials.forEach((official, index) => {
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const officialInfo = `${index + 1}. ${official.name} - ${official.villageName} - ${official.centerName} - ${official.mobile}`;
        pdf.text(officialInfo, 20, yPosition);
        yPosition += 8;
      });
      
      // حفظ الملف
      pdf.save(`تقرير-شامل-${currentDate.replace(/\//g, '-')}.pdf`);
      
      alert('تم تصدير التقرير الشامل بصيغة PDF بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsExporting(prev => ({ ...prev, pdf: false }));
    }
  };

  const exportOfficialsToExcel = () => {
    try {
      setIsExporting(prev => ({ ...prev, excel: true }));
      // إعداد البيانات للتصدير
      const officialsData = firebaseOfficials.map((official, index) => ({
        'الرقم': index + 1,
        'الاسم الكامل': official.name,
        'الرقم القومي': official.nationalId,
        'رقم الموبايل': official.mobile,
        'القرية': official.villageName,
        'الوحدة المحلية': official.unitName,
        'المركز': official.centerName,
        'الملاحظات': official.notes || '-',
        'تاريخ الإضافة': official.createdAt ? new Date(official.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : '-'
      }));
      
      // إنشاء ورقة العمل
      const worksheet = XLSX.utils.json_to_sheet(officialsData);
      
      // إعداد عرض الأعمدة
      const columnWidths = [
        { wch: 8 },   // الرقم
        { wch: 25 },  // الاسم
        { wch: 15 },  // الرقم القومي
        { wch: 15 },  // الموبايل
        { wch: 20 },  // القرية
        { wch: 20 },  // الوحدة
        { wch: 15 },  // المركز
        { wch: 30 },  // الملاحظات
        { wch: 15 }   // التاريخ
      ];
      worksheet['!cols'] = columnWidths;
      
      // إنشاء كتاب العمل
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المسؤولين');
      
      // إضافة ورقة الإحصائيات
      const statsData = [
        { 'البيان': 'إجمالي السكان', 'القيمة': districtStats.totalPopulation.toLocaleString() },
        { 'البيان': 'إجمالي المسؤولين', 'القيمة': firebaseOfficials.length.toString() },
        { 'البيان': 'عدد القرى', 'القيمة': districtStats.totalVillages.toString() },
        { 'البيان': 'القرى المغطاة', 'القيمة': detailedStats.villagesWithOfficials.toString() },
        { 'البيان': 'القرى غير المغطاة', 'القيمة': detailedStats.villagesWithoutOfficials.toString() },
        { 'البيان': 'معدل التغطية العام', 'القيمة': `${Math.round((detailedStats.villagesWithOfficials / districtStats.totalVillages) * 100)}%` }
      ];
      
      const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
      statsWorksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'الإحصائيات');
      
      // حفظ الملف
      const currentDate = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
      XLSX.writeFile(workbook, `بيانات-المسؤولين-${currentDate}.xlsx`);
      
      alert('تم تصدير بيانات المسؤولين بصيغة Excel بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert('حدث خطأ أثناء تصدير البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsExporting(prev => ({ ...prev, excel: false }));
    }
  };

  const exportCoverageToCSV = () => {
    try {
      setIsExporting(prev => ({ ...prev, csv: true }));
      // إعداد بيانات التغطية
      const coverageData = detailedStats.coverageByUnit.map((unit, index) => ({
        'الرقم': index + 1,
        'المركز': unit.centerName,
        'الوحدة المحلية': unit.unitName,
        'عدد القرى': unit.villages,
        'عدد المسؤولين': unit.officials,
        'عدد السكان': unit.population.toLocaleString(),
        'معدل التغطية': `${unit.coverage}%`,
        'حالة التغطية': unit.coverage >= 80 ? 'ممتازة' : unit.coverage >= 50 ? 'جيدة' : 'تحتاج تحسين'
      }));
      
      // تحويل إلى CSV
      const worksheet = XLSX.utils.json_to_sheet(coverageData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      
      // إنشاء وتحميل الملف
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      const currentDate = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
      link.setAttribute('download', `إحصائيات-التغطية-${currentDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('تم تصدير إحصائيات التغطية بصيغة CSV بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير CSV:', error);
      alert('حدث خطأ أثناء تصدير الإحصائيات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsExporting(prev => ({ ...prev, csv: false }));
    }
  };

  const exportDetailedReport = () => {
    try {
      setIsExporting(prev => ({ ...prev, detailed: true }));
      // إعداد تقرير مفصل عن كل قرية
      const villageDetails: Array<{
        'المركز': string;
        'الوحدة المحلية': string;
        'القرية': string;
        'عدد السكان': number;
        'المسؤولين': string;
        'عدد المسؤولين': number;
        'حالة التغطية': string;
      }> = [];

      campaignData.forEach(center => {
        center.localUnits.forEach(unit => {
          unit.villages.forEach(village => {
            const villageOfficials = firebaseOfficials.filter(
              official => official.villageName === village.name && official.centerId === center.id
            );
            
            villageDetails.push({
              'المركز': center.name,
              'الوحدة المحلية': unit.name,
              'القرية': village.name,
              'عدد السكان': village.population,
              'المسؤولين': villageOfficials.map(o => o.name).join(', ') || 'لا يوجد',
              'عدد المسؤولين': villageOfficials.length,
              'حالة التغطية': villageOfficials.length > 0 ? 'مغطاة' : 'غير مغطاة'
            });
          });
        });
      });

      // إنشاء ملف Excel مفصل
      const workbook = XLSX.utils.book_new();
      
      // ورقة تفاصيل القرى
      const villagesSheet = XLSX.utils.json_to_sheet(villageDetails);
      villagesSheet['!cols'] = [
        { wch: 15 }, // المركز
        { wch: 20 }, // الوحدة
        { wch: 20 }, // القرية
        { wch: 12 }, // السكان
        { wch: 40 }, // المسؤولين
        { wch: 12 }, // عدد المسؤولين
        { wch: 15 }  // حالة التغطية
      ];
      XLSX.utils.book_append_sheet(workbook, villagesSheet, 'تفاصيل القرى');
      
      // ورقة المسؤولين
      const officialsData = firebaseOfficials.map((official, index) => ({
        'الرقم': index + 1,
        'الاسم': official.name,
        'الرقم القومي': official.nationalId,
        'الموبايل': official.mobile,
        'القرية': official.villageName,
        'الوحدة': official.unitName,
        'المركز': official.centerName,
        'الملاحظات': official.notes || ''
      }));
      
      const officialsSheet = XLSX.utils.json_to_sheet(officialsData);
      officialsSheet['!cols'] = [
        { wch: 8 },  // الرقم
        { wch: 25 }, // الاسم
        { wch: 15 }, // الرقم القومي
        { wch: 15 }, // الموبايل
        { wch: 20 }, // القرية
        { wch: 20 }, // الوحدة
        { wch: 15 }, // المركز
        { wch: 30 }  // الملاحظات
      ];
      XLSX.utils.book_append_sheet(workbook, officialsSheet, 'المسؤولين');
      
      // ورقة إحصائيات المراكز
      const centersStats = detailedStats.centerStats.map((center, index) => ({
        'الرقم': index + 1,
        'المركز': center.name,
        'عدد القرى': center.villages,
        'عدد المسؤولين': center.officialsCount,
        'عدد السكان': center.population.toLocaleString(),
        'معدل التغطية': `${center.coverage}%`,
        'القرى المغطاة': Math.round(center.villages * center.coverage / 100),
        'القرى غير المغطاة': center.villages - Math.round(center.villages * center.coverage / 100)
      }));
      
      const centersSheet = XLSX.utils.json_to_sheet(centersStats);
      centersSheet['!cols'] = [
        { wch: 8 },  // الرقم
        { wch: 20 }, // المركز
        { wch: 12 }, // القرى
        { wch: 15 }, // المسؤولين
        { wch: 15 }, // السكان
        { wch: 12 }, // التغطية
        { wch: 15 }, // المغطاة
        { wch: 15 }  // غير المغطاة
      ];
      XLSX.utils.book_append_sheet(workbook, centersSheet, 'إحصائيات المراكز');
      
      // حفظ الملف
      const currentDate = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-');
      XLSX.writeFile(workbook, `تقرير-مفصل-${currentDate}.xlsx`);
      
      alert('تم تصدير التقرير المفصل بنجاح!');
    } catch (error) {
      console.error('خطأ في تصدير التقرير المفصل:', error);
      alert('حدث خطأ أثناء تصدير التقرير. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsExporting(prev => ({ ...prev, detailed: false }));
    }
  };

  // جلب المسؤولين من Firebase عند تحميل المكون
  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    try {
      setIsLoading(true);
      const officials = await getAllOfficials();
      setFirebaseOfficials(officials);
    } catch (error) {
      console.error('خطأ في جلب المسؤولين:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // دالة لإضافة مسؤول جديد
  const handleAddOfficial = async () => {
    if (!selectedCenter || !selectedVillage) return;
    
    setIsAddingOfficial(true);
    try {
      // العثور على الوحدة المحلية للقرية المختارة
      let unitName = '';
      selectedCenter.localUnits.forEach(unit => {
        unit.villages.forEach(village => {
          if (village.name === selectedVillage.name) {
            unitName = unit.name;
          }
        });
      });
      
      // إضافة المسؤول الجديد إلى Firebase
      const officialData = {
        name: newOfficial.name,
        nationalId: newOfficial.nationalId,
        mobile: newOfficial.mobile,
        notes: newOfficial.notes,
        villageName: selectedVillage.name,
        unitName: unitName,
        centerId: selectedCenter.id,
        centerName: selectedCenter.name,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'officials'), officialData);
      
      console.log('تم إضافة المسؤول بنجاح بالمعرف:', docRef.id);
      
      // إعادة تعيين النموذج
      resetForm();
      
      // إغلاق الـ modal
      setIsDialogOpen(false);
      
      // إعادة جلب المسؤولين بعد الإضافة
      await fetchOfficials();
      
      // رسالة نجاح
      alert('تم إضافة المسؤول بنجاح!');
      
    } catch (error) {
      console.error('خطأ في إضافة المسؤول:', error);
      alert('حدث خطأ أثناء إضافة المسؤول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsAddingOfficial(false);
    }
  };

  // دالة لإعادة تعيين النموذج
  const resetForm = () => {
    setNewOfficial({
      name: '',
      nationalId: '',
      mobile: '',
      notes: '',
      centerId: '',
      centerName: '',
      unitName: '',
      villageName: ''
    });
    setSelectedCenter(null);
    setSelectedVillage(null);
  };

  // دالة لتغيير المركز المختار
  const handleCenterChange = (centerId: string) => {
    const center = campaignData.find(c => c.id === centerId);
    setSelectedCenter(center || null);
    setSelectedVillage(null); // إعادة تعيين القرية عند تغيير المركز
  };

  // دالة لتغيير القرية المختارة
  const handleVillageChange = (villageName: string) => {
    if (!selectedCenter) return;
    
    let foundVillage: Village | null = null;
    selectedCenter.localUnits.forEach(unit => {
      unit.villages.forEach(village => {
        if (village.name === villageName) {
          foundVillage = village;
        }
      });
    });
    
    setSelectedVillage(foundVillage);
  };

  // دالة لتغيير قيم النموذج
  const handleInputChange = (field: keyof Pick<NewOfficial, 'name' | 'nationalId' | 'mobile' | 'notes'>, value: string) => {
    setNewOfficial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // دالة لفتح موديل التعديل
  const handleEditOfficial = (official: FirebaseOfficial) => {
    setEditingOfficial(official);
    
    // العثور على المركز والقرية
    const center = campaignData.find(c => c.id === official.centerId);
    if (center) {
      setSelectedCenter(center);
      
      // العثور على القرية
      let foundVillage: Village | null = null;
      center.localUnits.forEach(unit => {
        unit.villages.forEach(village => {
          if (village.name === official.villageName) {
            foundVillage = village;
          }
        });
      });
      setSelectedVillage(foundVillage);
    }
    
    // ملء النموذج ببيانات المسؤول
    setNewOfficial({
      name: official.name,
      nationalId: official.nationalId,
      mobile: official.mobile,
      notes: official.notes || '',
      centerId: official.centerId,
      centerName: official.centerName,
      unitName: official.unitName,
      villageName: official.villageName
    });
    
    setIsEditDialogOpen(true);
  };

  // دالة لتحديث المسؤول
  const handleUpdateOfficial = async () => {
    if (!editingOfficial || !selectedCenter || !selectedVillage) return;
    
    setIsUpdatingOfficial(true);
    try {
      // العثور على الوحدة المحلية للقرية المختارة
      let unitName = '';
      selectedCenter.localUnits.forEach(unit => {
        unit.villages.forEach(village => {
          if (village.name === selectedVillage.name) {
            unitName = unit.name;
          }
        });
      });
      
      // تحديث بيانات المسؤول في Firebase
      const officialRef = doc(db, 'officials', editingOfficial.id);
      const updatedData = {
        name: newOfficial.name,
        nationalId: newOfficial.nationalId,
        mobile: newOfficial.mobile,
        notes: newOfficial.notes,
        villageName: selectedVillage.name,
        unitName: unitName,
        centerId: selectedCenter.id,
        centerName: selectedCenter.name,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(officialRef, updatedData);
      
      console.log('تم تحديث المسؤول بنجاح');
      
      // إعادة تعيين النموذج
      resetForm();
      setEditingOfficial(null);
      
      // إغلاق الـ modal
      setIsEditDialogOpen(false);
      
      // إعادة جلب المسؤولين بعد التحديث
      await fetchOfficials();
      
      // رسالة نجاح
      alert('تم تحديث بيانات المسؤول بنجاح!');
      
    } catch (error) {
      console.error('خطأ في تحديث المسؤول:', error);
      alert('حدث خطأ أثناء تحديث بيانات المسؤول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingOfficial(false);
    }
  };

  // دالة لفتح موديل الحذف
  const handleDeleteClick = (official: FirebaseOfficial) => {
    setOfficialToDelete(official);
    setIsDeleteDialogOpen(true);
  };

  // دالة لحذف المسؤول
  const handleDeleteOfficial = async () => {
    if (!officialToDelete) return;
    
    setIsDeletingOfficial(true);
    try {
      // حذف المسؤول من Firebase
      const officialRef = doc(db, 'officials', officialToDelete.id);
      await deleteDoc(officialRef);
      
      console.log('تم حذف المسؤول بنجاح');
      
      // إغلاق الـ modal
      setIsDeleteDialogOpen(false);
      setOfficialToDelete(null);
      
      // إعادة جلب المسؤولين بعد الحذف
      await fetchOfficials();
      
      // رسالة نجاح
      alert('تم حذف المسؤول بنجاح!');
      
    } catch (error) {
      console.error('خطأ في حذف المسؤول:', error);
      alert('حدث خطأ أثناء حذف المسؤول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsDeletingOfficial(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f9fafb, #ffffff)' }}>
      <div className="mx-auto max-w-7xl">
        {/* رأس لوحة التحكم */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                <MdDashboard className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#3b82f6' }} />
                لوحة التحكم
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base" style={{ color: '#6b7280' }}>
                إدارة الحملة الانتخابية للمهندس علي البيلي
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="w-full sm:w-auto" style={{ background: '#3b82f6', color: 'white' }}>
                  <FaPlus className="ml-2 w-4 h-4" />
                  <span>إضافة مسؤول جديد</span>
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* الإحصائيات الرئيسية */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm font-medium">
                        إجمالي السكان
                      </p>
                      <p className="text-xl sm:text-3xl font-bold mt-1">
                        {districtStats.totalPopulation.toLocaleString()}
                      </p>
                    </div>
                    <FaUsers className="w-6 h-6 sm:w-10 sm:h-10 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-green-500 text-white shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs sm:text-sm font-medium">
                        إجمالي المسؤولين
                      </p>
                      <p className="text-xl sm:text-3xl font-bold mt-1">
                        {firebaseOfficials.length}
                      </p>
                    </div>
                    <FaUserTie className="w-6 h-6 sm:w-10 sm:h-10 text-green-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-purple-500 text-white shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs sm:text-sm font-medium">
                        عدد القرى
                      </p>
                      <p className="text-xl sm:text-3xl font-bold mt-1">
                        {districtStats.totalVillages}
                      </p>
                    </div>
                    <FaMapMarkerAlt className="w-6 h-6 sm:w-10 sm:h-10 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-xs sm:text-sm font-medium">
                        معدل التغطية
                      </p>
                      <p className="text-xl sm:text-3xl font-bold mt-1">
                        {Math.round((firebaseOfficials.length / districtStats.totalVillages) * 100)}%
                      </p>
                    </div>
                    <FaChartLine className="w-6 h-6 sm:w-10 sm:h-10 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* تبويبات إدارة البيانات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <Tabs defaultValue="centers" className="w-full">
            <TabsList
              className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1"
              style={{ background: '#f3f4f6' }}
            >
              <TabsTrigger
                value="centers"
                className="text-xs sm:text-sm py-2"
                style={{
                  background: 'var(--tab-centers-bg)',
                  boxShadow: 'var(--tab-centers-shadow)'
                }}
                data-active-style="{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }"
              >
                <MdLocationCity className="w-4 h-4 ml-1" />
                المراكز
              </TabsTrigger>
              <TabsTrigger
                value="officials"
                className="text-xs sm:text-sm py-2"
                style={{
                  background: 'var(--tab-officials-bg)',
                  boxShadow: 'var(--tab-officials-shadow)'
                }}
                data-active-style="{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }"
              >
                <FaUserTie className="w-4 h-4 ml-1" />
                المسؤولين
              </TabsTrigger>
              <TabsTrigger
                value="villages"
                className="text-xs sm:text-sm py-2"
                style={{
                  background: 'var(--tab-villages-bg)',
                  boxShadow: 'var(--tab-villages-shadow)'
                }}
                data-active-style="{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }"
              >
                <FaMapMarkerAlt className="w-4 h-4 ml-1" />
                القرى
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                className="text-xs sm:text-sm py-2"
                style={{
                  background: 'var(--tab-statistics-bg)',
                  boxShadow: 'var(--tab-statistics-shadow)'
                }}
                data-active-style="{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }"
              >
                <FaChartLine className="w-4 h-4 ml-1" />
                الإحصائيات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="centers" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <MdLocationCity className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                    إدارة المراكز
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {campaignData.map((center) => {
                      const stats = getCenterStats(center.id);
                      const centerOfficials = firebaseOfficials.filter(official => official.centerId === center.id);
                      
                      return (
                        <motion.div
                          key={center.id}
                          whileHover={{ scale: 1.02 }}
                          className="group"
                        >
                          <Card className="h-full shadow-md group-hover:shadow-lg transition-all" style={{ border: 'none' }}>
                            <CardHeader className="text-center p-4 sm:p-6 bg-gradient-to-r from-primary/5 to-primary/10">
                              <CardTitle className="text-lg sm:text-xl">{center.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="space-y-1 p-2 rounded-lg" style={{ background: '#f3f4f6' }}>
                                  <FaUsers className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" style={{ color: '#3b82f6' }} />
                                  <div className="font-bold text-sm">{stats?.population.toLocaleString()}</div>
                                  <div className="text-xs" style={{ color: '#6b7280' }}>نسمة</div>
                                </div>
                                <div className="space-y-1 p-2 rounded-lg" style={{ background: '#f3f4f6' }}>
                                  <FaUserTie className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                                  <div className="font-bold text-sm">{centerOfficials.length}</div>
                                  <div className="text-xs" style={{ color: '#6b7280' }}>مسؤول</div>
                                </div>
                                <div className="space-y-1 p-2 rounded-lg" style={{ background: '#f3f4f6' }}>
                                  <FaMapMarkerAlt className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mx-auto" />
                                  <div className="font-bold text-sm">{stats?.villages}</div>
                                  <div className="text-xs" style={{ color: '#6b7280' }}>قرية</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">الوحدات المحلية:</h5>
                                {center.localUnits.map((unit, unitIndex) => (
                                  <div key={unitIndex} className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#e5e7eb' }}>
                                    <span className="text-sm">{unit.name}</span>
                                    <Badge variant="secondary" className="text-xs">{unit.villages.length} قرية</Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="officials" className="mt-6">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 gap-3 sm:gap-0" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <FaUserTie className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                    إدارة المسؤولين
                  </CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={fetchOfficials} className="flex-1 sm:flex-none">
                      تحديث
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1 sm:flex-none" style={{ background: '#3b82f6', color: 'white' }}>
                          <FaPlus className="ml-2 w-4 h-4" />
                          إضافة
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#3b82f6' }}></div>
                      <p className="mt-4" style={{ color: '#6b7280' }}>جاري تحميل البيانات...</p>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                      <Table>
                        <TableHeader style={{ background: '#f3f4f6' }}>
                          <TableRow>
                            <TableHead className="text-sm font-semibold">الاسم</TableHead>
                            <TableHead className="text-sm font-semibold">القرية</TableHead>
                            <TableHead className="text-sm font-semibold hidden sm:table-cell">المركز</TableHead>
                            <TableHead className="text-sm font-semibold hidden md:table-cell">رقم الموبايل</TableHead>
                            <TableHead className="text-sm font-semibold hidden lg:table-cell">الملاحظات</TableHead>
                            <TableHead className="text-sm font-semibold text-center">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {firebaseOfficials.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12" style={{ color: '#6b7280' }}>
                                <FaUserTie className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
                                <p className="text-lg font-medium">لا توجد بيانات مسؤولين حالياً</p>
                                <p className="text-sm mt-2">ابدأ بإضافة مسؤولين جديدين للنظام</p>
                                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                                  <FaPlus className="ml-2 w-4 h-4" />
                                  إضافة مسؤول جديد
                                </Button>
                              </TableCell>
                            </TableRow>
                          ) : (
                            firebaseOfficials.map((official) => (
                              <TableRow key={official.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-sm">{official.name}</TableCell>
                                <TableCell className="text-sm">{official.villageName}</TableCell>
                                <TableCell className="hidden sm:table-cell">
                                  <Badge variant="secondary" className="text-xs">{official.centerName}</Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-sm">{official.mobile}</TableCell>
                                <TableCell className="hidden lg:table-cell max-w-xs truncate text-sm">
                                  {official.notes || '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center gap-1 sm:gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditOfficial(official)}
                                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                      title="تعديل"
                                    >
                                      <FaEdit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteClick(official)}
                                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                                      title="حذف"
                                    >
                                      <FaTrash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="villages" className="mt-6">
              <Card>
                <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <FaMapMarkerAlt className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                    إدارة القرى
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-6">
                    {campaignData.map(center => (
                      <div key={center.id}>
                        <h4 className="font-semibold text-lg mb-4 p-3 rounded-lg" style={{ background: '#e5e7eb' }}>{center.name}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {center.localUnits.map((unit, unitIndex) =>
                            unit.villages.map((village, villageIndex) => {
                              const villageOfficials = firebaseOfficials.filter(
                                official => official.villageName === village.name
                              );
                              return (
                                <Card key={`${unitIndex}-${villageIndex}`} className="shadow-md hover:shadow-lg transition-all" style={{ border: 'none' }}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h5 className="font-medium text-base">{village.name}</h5>
                                      <Badge variant={villageOfficials.length > 0 ? "default" : "secondary"} className="text-xs">
                                        {villageOfficials.length} مسؤول
                                      </Badge>
                                    </div>
                                    <div className="text-sm mb-3" style={{ color: '#6b7280' }}>
                                      السكان: {village.population.toLocaleString()} نسمة
                                    </div>
                                    <div className="text-xs mb-3" style={{ color: '#6b7280' }}>
                                      الوحدة: {unit.name}
                                    </div>
                                    {villageOfficials.length === 0 ? (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full text-xs"
                                        onClick={() => {
                                          setSelectedCenter(center);
                                          setSelectedVillage(village);
                                          setIsDialogOpen(true);
                                        }}
                                      >
                                        <FaPlus className="ml-2 w-3 h-3" />
                                        إضافة مسؤول
                                      </Button>
                                    ) : (
                                      <div className="space-y-2">
                                        {villageOfficials.slice(0, 2).map((official) => (
                                          <div key={official.id} className="text-xs p-2 rounded" style={{ background: '#e5e7eb' }}>
                                            <div className="font-medium">{official.name}</div>
                                            <div style={{ color: '#6b7280' }}>📱 {official.mobile}</div>
                                          </div>
                                        ))}
                                        {villageOfficials.length > 2 && (
                                          <div className="text-xs text-center" style={{ color: '#6b7280' }}>
                                            و {villageOfficials.length - 2} مسؤول آخر
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statistics" className="mt-6">
              <div className="space-y-6">
                {/* نظرة عامة على التغطية */}
                <Card>
                  <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <MdPieChart className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                      نظرة عامة على التغطية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                      <Card className="bg-gradient-to-r from-green-50 to-green-100" style={{ border: '1px solid #bbf7d0' }}>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full mx-auto mb-3">
                            <FaCheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-green-700 mb-1">
                            {detailedStats.villagesWithOfficials}
                          </div>
                          <div className="text-sm text-green-600">قرية مغطاة</div>
                          <div className="text-xs text-green-500 mt-1">
                            {Math.round((detailedStats.villagesWithOfficials / districtStats.totalVillages) * 100)}% من إجمالي القرى
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-red-50 to-red-100" style={{ border: '1px solid #fecaca' }}>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-full mx-auto mb-3">
                            <FaExclamationCircle className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-red-700 mb-1">
                            {detailedStats.villagesWithoutOfficials}
                          </div>
                          <div className="text-sm text-red-600">قرية غير مغطاة</div>
                          <div className="text-xs text-red-500 mt-1">
                            {Math.round((detailedStats.villagesWithoutOfficials / districtStats.totalVillages) * 100)}% من إجمالي القرى
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100" style={{ border: '1px solid #dbeafe' }}>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3">
                            <MdTrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-blue-700 mb-1">
                            {Math.round((detailedStats.villagesWithOfficials / districtStats.totalVillages) * 100)}%
                          </div>
                          <div className="text-sm text-blue-600">معدل التغطية العام</div>
                          <Progress 
                            value={(detailedStats.villagesWithOfficials / districtStats.totalVillages) * 100} 
                            className="mt-2 h-2"
                          />
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-purple-50 to-purple-100" style={{ border: '1px solid #e9d5ff' }}>
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3">
                            <FaUsers className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-2xl font-bold text-purple-700 mb-1">
                            {Math.round(districtStats.totalPopulation / firebaseOfficials.length).toLocaleString()}
                          </div>
                          <div className="text-sm text-purple-600">نسمة لكل مسؤول</div>
                          <div className="text-xs text-purple-500 mt-1">متوسط التغطية السكانية</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* أفضل المراكز في التغطية */}
                <Card>
                  <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FaChartLine className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                      أفضل المراكز في التغطية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {detailedStats.topCenters.map((center, index) => (
                        <div key={center.id} className="flex items-center justify-between p-4 rounded-lg" style={{ background: '#e5e7eb' }}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold">{center.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {center.officialsCount} مسؤول من {center.villages} قرية
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{center.coverage}%</div>
                            <Progress value={center.coverage} className="w-24 h-2 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* إحصائيات الوحدات المحلية */}
                <Card>
                  <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <MdLocationCity className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                      إحصائيات الوحدات المحلية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
                      <Table>
                        <TableHeader style={{ background: '#f3f4f6' }}>
                          <TableRow>
                            <TableHead className="text-sm font-semibold">المركز</TableHead>
                            <TableHead className="text-sm font-semibold">الوحدة المحلية</TableHead>
                            <TableHead className="text-sm font-semibold text-center">القرى</TableHead>
                            <TableHead className="text-sm font-semibold text-center">المسؤولين</TableHead>
                            <TableHead className="text-sm font-semibold text-center">السكان</TableHead>
                            <TableHead className="text-sm font-semibold text-center">التغطية</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailedStats.coverageByUnit.slice(0, 15).map((unit, index) => (
                            <TableRow key={`${unit.centerName}-${unit.unitName}`} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-sm">{unit.centerName}</TableCell>
                              <TableCell className="text-sm">{unit.unitName}</TableCell>
                              <TableCell className="text-center text-sm">{unit.villages}</TableCell>
                              <TableCell className="text-center text-sm">{unit.officials}</TableCell>
                              <TableCell className="text-center text-sm">{unit.population.toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={unit.coverage >= 80 ? "default" : unit.coverage >= 50 ? "secondary" : "destructive"}
                                    className="text-xs"
                                  >
                                    {unit.coverage}%
                                  </Badge>
                                  <Progress value={unit.coverage} className="w-16 h-2" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {detailedStats.coverageByUnit.length > 15 && (
                      <div className="text-center mt-4 text-sm" style={{ color: '#6b7280' }}>
                        عرض 15 من {detailedStats.coverageByUnit.length} وحدة محلية
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* تقرير التصدير */}
                <Card>
                  <CardHeader className="p-4 sm:p-6" style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <FaDownload className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#3b82f6' }} />
                      تصدير التقارير
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-red-50 hover:border-red-200 transition-colors"
                        onClick={exportToPDF}
                        disabled={isExporting.pdf}
                      >
                        {isExporting.pdf ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                        ) : (
                          <FaFilePdf className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isExporting.pdf ? 'جاري التصدير...' : 'تقرير شامل'}
                        </span>
                        <span className="text-xs text-muted-foreground">PDF</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                        onClick={exportOfficialsToExcel}
                        disabled={isExporting.excel}
                      >
                        {isExporting.excel ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        ) : (
                          <FaFileExcel className="w-5 h-5 text-green-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isExporting.excel ? 'جاري التصدير...' : 'بيانات المسؤولين'}
                        </span>
                        <span className="text-xs text-muted-foreground">Excel</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        onClick={exportCoverageToCSV}
                        disabled={isExporting.csv}
                      >
                        {isExporting.csv ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        ) : (
                          <FaFileCsv className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isExporting.csv ? 'جاري التصدير...' : 'إحصائيات التغطية'}
                        </span>
                        <span className="text-xs text-muted-foreground">CSV</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-20 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                        onClick={exportDetailedReport}
                        disabled={isExporting.detailed}
                      >
                        {isExporting.detailed ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                        ) : (
                          <FaFileExcel className="w-5 h-5 text-purple-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isExporting.detailed ? 'جاري التصدير...' : 'تقرير مفصل'}
                        </span>
                        <span className="text-xs text-muted-foreground">Excel متقدم</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* موديل إضافة مسؤول جديد */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" style={{ background: '#fff' }}>
            <DialogHeader className="px-6 pt-6 pb-4" style={{ background: '#f9fafb' }}>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FaPlus className="w-5 h-5" style={{ color: '#3b82f6' }} />
                إضافة مسؤول جديد
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              {/* اختيار المركز */}
              <div className="space-y-2">
                <Label htmlFor="center" className="text-sm font-medium">
                  المركز
                </Label>
                <Select onValueChange={handleCenterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركز" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignData.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اختيار القرية */}
              <div className="space-y-2">
                <Label htmlFor="village" className="text-sm font-medium">
                  القرية
                </Label>
                <Select 
                  onValueChange={handleVillageChange}
                  disabled={!selectedCenter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCenter ? "اختر القرية" : "اختر المركز أولاً"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCenter?.localUnits.map((unit) =>
                      unit.villages.map((village) => (
                        <SelectItem key={village.name} value={village.name}>
                          {village.name} - {unit.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* اسم المسؤول */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  الاسم الكامل
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newOfficial.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  className="text-right"
                  minLength={2}
                  required
                />
              </div>

              {/* الرقم القومي */}
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-sm font-medium">
                  الرقم القومي
                </Label>
                <Input
                  id="nationalId"
                  type="text"
                  value={newOfficial.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  placeholder="أدخل الرقم القومي (14 رقم)"
                  className="text-right"
                  maxLength={14}
                  minLength={14}
                  pattern="[0-9]{14}"
                  required
                />
              </div>

              {/* رقم الموبايل */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  رقم الموبايل
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={newOfficial.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="أدخل رقم الموبايل (01xxxxxxxxx)"
                  className="text-right"
                  maxLength={11}
                  minLength={11}
                  pattern="01[0-2,5][0-9]{8}"
                  required
                />
              </div>

              {/* الملاحظات */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  ملاحظات
                </Label>
                <Textarea
                  id="notes"
                  value={newOfficial.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية (اختياري)"
                  className="text-right min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4" style={{ background: '#f3f4f6' }}>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)} 
                disabled={isAddingOfficial}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleAddOfficial}
                disabled={
                  !newOfficial.name || 
                  !newOfficial.nationalId || 
                  !newOfficial.mobile || 
                  !selectedCenter || 
                  !selectedVillage || 
                  isAddingOfficial
                }
                style={{ background: '#3b82f6', color: 'white' }}
              >
                {isAddingOfficial ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإضافة...
                  </>
                ) : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* موديل تعديل المسؤول */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingOfficial(null);
          }
        }}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" style={{ background: '#fff' }}>
            <DialogHeader className="px-6 pt-6 pb-4" style={{ background: '#f9fafb' }}>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FaEdit className="w-5 h-5 text-blue-600" />
                تعديل بيانات المسؤول
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-4">
              {/* اختيار المركز */}
              <div className="space-y-2">
                <Label htmlFor="center" className="text-sm font-medium">
                  المركز
                </Label>
                <Select value={selectedCenter?.id || ''} onValueChange={handleCenterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المركز" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignData.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* اختيار القرية */}
              <div className="space-y-2">
                <Label htmlFor="village" className="text-sm font-medium">
                  القرية
                </Label>
                <Select 
                  value={selectedVillage?.name || ''}
                  onValueChange={handleVillageChange}
                  disabled={!selectedCenter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCenter ? "اختر القرية" : "اختر المركز أولاً"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCenter?.localUnits.map((unit) =>
                      unit.villages.map((village) => (
                        <SelectItem key={village.name} value={village.name}>
                          {village.name} - {unit.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* اسم المسؤول */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  الاسم الكامل
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={newOfficial.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                  className="text-right"
                  minLength={2}
                  required
                />
              </div>

              {/* الرقم القومي */}
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-sm font-medium">
                  الرقم القومي
                </Label>
                <Input
                  id="nationalId"
                  type="text"
                  value={newOfficial.nationalId}
                  onChange={(e) => handleInputChange('nationalId', e.target.value)}
                  placeholder="أدخل الرقم القومي (14 رقم)"
                  className="text-right"
                  maxLength={14}
                  minLength={14}
                  pattern="[0-9]{14}"
                  required
                />
              </div>

              {/* رقم الموبايل */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  رقم الموبايل
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={newOfficial.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="أدخل رقم الموبايل (01xxxxxxxxx)"
                  className="text-right"
                  maxLength={11}
                  minLength={11}
                  pattern="01[0-2,5][0-9]{8}"
                  required
                />
              </div>

              {/* الملاحظات */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  ملاحظات
                </Label>
                <Textarea
                  id="notes"
                  value={newOfficial.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="أدخل أي ملاحظات إضافية (اختياري)"
                  className="text-right min-h-[80px]"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4" style={{ background: '#f3f4f6' }}>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)} 
                disabled={isUpdatingOfficial}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleUpdateOfficial}
                disabled={
                  !newOfficial.name || 
                  !newOfficial.nationalId || 
                  !newOfficial.mobile || 
                  !selectedCenter || 
                  !selectedVillage || 
                  isUpdatingOfficial
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdatingOfficial ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التحديث...
                  </>
                ) : 'تحديث'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* موديل تأكيد الحذف */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]" style={{ background: '#fff' }}>
            <DialogHeader>
              <div className="flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4" style={{ background: '#fee2e2' }}>
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-center text-xl font-bold text-red-700">
                تأكيد الحذف
              </DialogTitle>
              <DialogDescription className="text-center" style={{ color: '#6b7280' }}>
                هذا الإجراء لا يمكن التراجع عنه
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-center space-y-4">
                <p className="text-lg font-medium">
                  هل أنت متأكد من حذف المسؤول؟
                </p>
                {officialToDelete && (
                  <div className="p-4 rounded-lg text-right border" style={{ background: '#fee2e2', borderColor: '#fecaca' }}>
                    <div className="font-bold text-red-800">{officialToDelete.name}</div>
                    <div className="text-red-700 text-sm mt-1">
                      🏘️ {officialToDelete.villageName} - {officialToDelete.centerName}
                    </div>
                    <div className="text-red-700 text-sm mt-1">
                      📱 {officialToDelete.mobile}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)} 
                disabled={isDeletingOfficial}
              >
                إلغاء
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteOfficial}
                disabled={isDeletingOfficial}
              >
                {isDeletingOfficial ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحذف...
                  </>
                ) : 'حذف نهائياً'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;