// Mapping of participant names to their photo files
const participantPhotos: Record<string, string> = {
  'امیرحسین شریفی نژاد': '/picture/participants/amirhossein sharif.jpeg',
  'امید نائیج نژاد': '/picture/participants/omid naeijnejad.jpeg',
  'علیرضا فیض آبادی فراهانی': '/picture/participants/alireza feyzabadi.jpeg',
  'امینه علیخانی': '/picture/participants/amine.jpeg',
  'پارمیس سبکتکین': '/picture/participants/parmis saboktakin.jpeg',
  'پانته آ سبکتکین': '/picture/participants/pantea saboktakin.jpeg',
  'میلاد حسینی': '/picture/participants/milad.jpeg',
  'محمد حسن کریمی': '/picture/participants/hosein karimi.jpeg',
  'پرهام زیلوچیان': '/picture/participants/parham.jpeg',
};

// Persian female names (common first names)
const femaleNames = [
  'نازنین', 'امینه', 'پارمیس', 'پانته', 'پانته‌آ', 'سارا', 'مریم', 'زهرا', 'فاطمه',
  'نرگس', 'مینا', 'نیلوفر', 'شیما', 'شیوا', 'پریسا', 'پرستو', 'آیدا', 'الهام',
  'مهسا', 'مهناز', 'مهشید', 'نگار', 'نگین', 'یاسمن', 'یاسمین', 'ریحانه', 'سحر',
  'شقایق', 'غزل', 'لیلا', 'مونا', 'هانیه', 'هستی', 'کیمیا', 'آتنا', 'آرزو',
  'بهاره', 'بهناز', 'پگاه', 'ترانه', 'درسا', 'دنیا', 'رها', 'روژان', 'زینب',
  'ساناز', 'سمیرا', 'سمیه', 'شبنم', 'شیرین', 'صبا', 'طناز', 'عسل', 'فرناز',
  'فریبا', 'کتایون', 'گلناز', 'ملیکا', 'ندا', 'نسترن', 'نسرین', 'نیکی', 'هدیه'
];

// Check if name is female based on first name
const isFemale = (fullName: string): boolean => {
  const firstName = fullName.split(' ')[0];
  return femaleNames.some(name => firstName.includes(name) || name.includes(firstName));
};

// Get avatar URL - first check for participant photo, then fallback to DiceBear
export const getAvatarUrl = (name: string): string => {
  // Check if participant has a real photo
  if (participantPhotos[name]) {
    return participantPhotos[name];
  }

  // Fallback to DiceBear avatar
  const female = isFemale(name);
  const seed = encodeURIComponent(name);

  if (female) {
    // Female: lorelei style (elegant feminine avatars)
    return `https://api.dicebear.com/7.x/lorelei/svg?seed=${seed}`;
  } else {
    // Male: micah style (clean, gender-neutral but works well for males)
    return `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`;
  }
};
