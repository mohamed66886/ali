// بيانات الحملة الانتخابية للمهندس علي البيلي

export interface Village {
  name: string;
  population: number;
  officials?: Official[];
}

export interface LocalUnit {
  name: string;
  villages: Village[];
}

export interface Center {
  id: string;
  name: string;
  localUnits: LocalUnit[];
}

export interface District {
  name: string;
  units: LocalUnit[];
}

export interface Official {
  id: string;
  name: string;
  village: string;
  position: string;
  phone?: string;
  createdAt: Date;
}

// تحويل البيانات من JSON إلى التنسيق المطلوب
const rawData = {
  "districts": [
    {
      "name": "مركز دكرنس",
      "units": [
        {
          "name": "منشأة عبد الرحمن",
          "villages": [
            { "name": "الحرية", "population": 3200 },
            { "name": "منشأة عبد الرحمن", "population": 8700 },
            { "name": "حمادة", "population": 2900 }
          ]
        },
        {
          "name": "نجير وميت شداد",
          "villages": [
            { "name": "كفر الزهايرة", "population": 5100 },
            { "name": "نجير", "population": 7300 },
            { "name": "ميت شداد", "population": 4200 },
            { "name": "العزازية", "population": 3100 },
            { "name": "البشمور", "population": 5600 },
            { "name": "كفر أبو علي", "population": 2700 },
            { "name": "كفر أبو ناصر", "population": 2600 },
            { "name": "القليوبية", "population": 3300 }
          ]
        },
        {
          "name": "ميت طريف",
          "villages": [
            { "name": "النهضة الجديدة", "population": 2400 },
            { "name": "ميت طريف", "population": 4100 }
          ]
        },
        {
          "name": "الربيعة",
          "villages": [{ "name": "الربيعة", "population": 3500 }]
        },
        {
          "name": "المحمودية",
          "villages": [
            { "name": "المحمودية", "population": 4700 },
            { "name": "السلام", "population": 3900 }
          ]
        },
        {
          "name": "ديمشلت",
          "villages": [
            { "name": "كفر الباز", "population": 2600 },
            { "name": "ديمشلت", "population": 8600 },
            { "name": "ميت النحال", "population": 5400 }
          ]
        },
        {
          "name": "دموة",
          "villages": [
            { "name": "جزيرة القباب", "population": 2800 },
            { "name": "المرساة", "population": 2500 },
            { "name": "ميت ضافر", "population": 3700 },
            { "name": "كفر عبد المؤمن", "population": 3000 },
            { "name": "الشيخ رضوان", "population": 2700 },
            { "name": "دموة", "population": 5200 },
            { "name": "كفر القباب", "population": 3100 },
            { "name": "القباب الكبرى", "population": 4600 },
            { "name": "الخشاشنة", "population": 2200 },
            { "name": "القباب الصغرى", "population": 1800 }
          ]
        },
        {
          "name": "أشمون الرمان",
          "villages": [
            { "name": "أشمون الرمان", "population": 4900 },
            { "name": "ميت شرف", "population": 2700 },
            { "name": "ميت السودان", "population": 3400 },
            { "name": "ميت سعدان", "population": 3000 },
            { "name": "الكرما الجديدة", "population": 2300 },
            { "name": "الكرما", "population": 2500 },
            { "name": "ناصر", "population": 3100 }
          ]
        }
      ]
    },
    {
      "name": "مركز بني عبيد",
      "units": [
        {
          "name": "اليوسيفية",
          "villages": [
            { "name": "اليوسيفية", "population": 4200 },
            { "name": "الحدادة", "population": 2800 },
            { "name": "أبو المعاطي الباز", "population": 3300 },
            { "name": "طلمبات بني عبيد", "population": 2100 }
          ]
        },
        {
          "name": "الصلاحات",
          "villages": [
            { "name": "الصلاحات", "population": 5300 },
            { "name": "كفر الصلاحات", "population": 3000 },
            { "name": "الزهيري", "population": 2600 }
          ]
        },
        {
          "name": "ميت سويد",
          "villages": [
            { "name": "ميت سويد", "population": 4800 },
            { "name": "طبيل", "population": 2300 },
            { "name": "ميت عدلان", "population": 4100 },
            { "name": "دير الخضر", "population": 2900 },
            { "name": "ميت فارس", "population": 3700 },
            { "name": "كفر ميت فارس", "population": 2500 },
            { "name": "منشأة مصبح", "population": 2100 },
            { "name": "الديسة", "population": 2000 }
          ]
        }
      ]
    },
    {
      "name": "مركز شربين",
      "units": [
        {
          "name": "الوحدات القروية",
          "villages": [
            { "name": "أبو جلال", "population": 2700 },
            { "name": "الاحمدية", "population": 2600 },
            { "name": "الحصص", "population": 3800 },
            { "name": "السعدية", "population": 3400 },
            { "name": "السلام", "population": 4100 },
            { "name": "الشناوي", "population": 2300 },
            { "name": "الصبرية", "population": 2000 },
            { "name": "الضهرية", "population": 2400 },
            { "name": "العوضية", "population": 3100 },
            { "name": "العيادية", "population": 2800 },
            { "name": "بساط كريم الدين", "population": 6200 },
            { "name": "ترعة غنيم", "population": 2300 },
            { "name": "دنجواي", "population": 7400 },
            { "name": "رأس الخليج", "population": 8800 },
            { "name": "كفر أبوزاهر وعزبها", "population": 3200 },
            { "name": "كفر الاطرش", "population": 2600 },
            { "name": "كفر الترعة الجديدة", "population": 2100 },
            { "name": "كفر الترعة القديم", "population": 2500 },
            { "name": "كفر الحاج شربيني", "population": 3000 },
            { "name": "كفر الحطبة", "population": 2800 },
            { "name": "كفر الدبوسي", "population": 3300 },
            { "name": "كفر الشيخ عطية", "population": 2700 },
            { "name": "كفر الوكالة", "population": 2400 },
            { "name": "كفر منشأة النصر", "population": 2900 },
            { "name": "كفر يوسف", "population": 3100 },
            { "name": "محلة أنشاق", "population": 4500 }
          ]
        }
      ]
    }
  ]
};

// تحويل البيانات إلى التنسيق المطلوب
export const campaignData: Center[] = rawData.districts.map((district) => ({
  id: district.name === "مركز دكرنس" ? "dakernes" : 
      district.name === "مركز بني عبيد" ? "bani_obeid" : "sherbin",
  name: district.name.replace("مركز ", ""),
  localUnits: district.units.map(unit => ({
    ...unit,
    villages: unit.villages.map(village => ({
      ...village,
      officials: [] // سيتم إضافة المسؤولين لاحقاً
    }))
  }))
}));

// دوال مساعدة لحساب الإحصائيات
export const getDistrictStats = () => {
  const totalPopulation = campaignData.reduce((total, center) => 
    total + center.localUnits.reduce((centerTotal, unit) =>
      centerTotal + unit.villages.reduce((unitTotal, village) =>
        unitTotal + village.population, 0), 0), 0);

  const totalOfficials = campaignData.reduce((total, center) => 
    total + center.localUnits.reduce((centerTotal, unit) =>
      centerTotal + unit.villages.reduce((unitTotal, village) =>
        unitTotal + (village.officials?.length || 0), 0), 0), 0);

  const totalVillages = campaignData.reduce((total, center) => 
    total + center.localUnits.reduce((centerTotal, unit) =>
      centerTotal + unit.villages.length, 0), 0);

  return { totalPopulation, totalOfficials, totalVillages };
};

export const getCenterStats = (centerId: string) => {
  const center = campaignData.find(c => c.id === centerId);
  if (!center) return null;

  const population = center.localUnits.reduce((total, unit) =>
    total + unit.villages.reduce((unitTotal, village) =>
      unitTotal + village.population, 0), 0);

  const officials = center.localUnits.reduce((total, unit) =>
    total + unit.villages.reduce((unitTotal, village) =>
      unitTotal + (village.officials?.length || 0), 0), 0);

  const villages = center.localUnits.reduce((total, unit) =>
    total + unit.villages.length, 0);

  return { population, officials, villages };
};
