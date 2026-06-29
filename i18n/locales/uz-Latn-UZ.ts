export const commonDictionary = {
  theme: {
    dark: "Tungi rejim",
    light: "Kunduzgi rejim",
  },
} as const;

export const landingDictionary = {
  nav: {
    login: "Kirish",
    start: "Boshlash",
  },
  hero: {
    badge: "Xususiy raqamli sinfxona",
    title: "Zamonaviy ta'lim uchun yopiq sinfxona.",
    description:
      "Modern Edu o'qituvchi va o'quvchilarni bitta tartibli muhitga jamlaydi: guruhlar, xabarlar, topshiriqlar, testlar va e'lonlar bir joyda.",
    primaryAction: "Kirish",
    secondaryAction: "Imkoniyatlar",
    imageAlt: "Modern Edu raqamli sinfxonasi",
  },
  metrics: [
    {
      value: "3 rol",
      label: "Administrator, ustoz, o'quvchi",
    },
    {
      value: "24/7",
      label: "Onlayn sinfxona",
    },
    {
      value: "100%",
      label: "Yopiq guruhlar",
    },
  ],
  classroom: {
    label: "Bugungi sinfxona",
    title: "Matematika guruhi",
    status: "Faol",
    items: {
      groups: "Guruhlar",
      voice: "Ovozli xabar",
      tests: "Testlar",
      files: "Fayllar",
    },
  },
  highlights: {
    chat: {
      title: "Darsdagi muloqot",
      text: "Matn, fayl, havola va ovozli xabarlar faqat biriktirilgan guruh ichida ko'rinadi.",
    },
    assignments: {
      title: "Topshiriqlar va testlar",
      text: "Ustozlar vazifa berishi, test yaratishi va natijalarni tartibli ko'rishi mumkin.",
    },
    private: {
      title: "Xavfsiz kirish",
      text: "Har bir foydalanuvchi faqat o'z roli va guruhiga tegishli ma'lumotlarni ko'radi.",
    },
  },
} as const;

export const authDictionary = {
  login: {
    metaTitle: "Kirish",
    back: "Ortga",
    sideLabel: "Modern Edu",
    sideTitle: "Sinfxonangiz doim yoningizda.",
    sideText:
      "Guruhlar, e'lonlar, testlar va topshiriqlar bir tartibda ishlashi uchun yaratilgan yopiq ta'lim muhiti.",
    sideStats: [
      {
        value: "Tez",
        label: "Kirish",
      },
      {
        value: "Aniq",
        label: "Rollar",
      },
      {
        value: "Yopiq",
        label: "Guruhlar",
      },
    ],
    eyebrow: "Hisobga kirish",
    title: "Xush kelibsiz",
    description:
      "Platformaga kirish uchun markaz administratori yoki ustoz bergan login va paroldan foydalaning.",
    username: "Foydalanuvchi nomi",
    usernamePlaceholder: "Foydalanuvchi nomingizni kiriting",
    password: "Parol",
    passwordPlaceholder: "Parolingizni kiriting",
    showPassword: "Parolni ko'rsatish",
    remember: "Eslab qolish",
    forgotPassword: "Yordam kerakmi?",
    submit: "Kirish",
    submitting: "Tekshirilmoqda...",
  },
} as const;

export const dashboardDictionary = {
  roles: {
    admin: "Administrator",
    teacher: "Ustoz",
    student: "O'quvchi",
  },
  actions: {
    logout: "Chiqish",
  },
  status: {
    foundation: "3-bosqich: ruxsatlar poydevori",
    next: "Bu bo'lim keyingi bosqichlarda to'liq funksional bo'ladi.",
  },
  admin: {
    title: "Boshqaruv paneli",
    description:
      "Bu yerda administratorlar ustozlar, tashkilot sozlamalari va umumiy xavfsizlikni boshqaradi.",
    items: ["Ustozlarni boshqarish", "Guruhlarni kuzatish", "Tizim xavfsizligi"],
  },
  teacher: {
    title: "Ustoz paneli",
    description:
      "Bu yerda ustozlar guruhlar, o'quvchilar, topshiriqlar va testlar bilan ishlaydi.",
    items: ["Mening guruhlarim", "O'quvchilar", "Topshiriqlar"],
  },
  student: {
    title: "O'quvchi paneli",
    description:
      "Bu yerda o'quvchilar o'z guruhlari, topshiriqlari va test natijalarini ko'radi.",
    items: ["Mening guruhlarim", "Topshiriqlar", "Testlar"],
  },
} as const;

export const navigationDictionary = {
  dashboard: "Bosh sahifa",
  teachers: "Ustozlar",
  students: "O'quvchilar",
  groups: "Guruhlar",
  myGroups: "Mening guruhlarim",
  messages: "Xabarlar",
  assignments: "Topshiriqlar",
  tests: "Testlar",
  reports: "Hisobotlar",
  notifications: "Bildirishnomalar",
  settings: "Sozlamalar",
  security: "Xavfsizlik",
} as const;

export const userManagementDictionary = {
  common: {
    fullName: "To'liq ism",
    fullNamePlaceholder: "Masalan: Ali Valiyev",
    username: "Foydalanuvchi nomi",
    usernamePlaceholder: "Masalan: ali.valiyev",
    password: "Vaqtinchalik parol",
    passwordPlaceholder: "Kamida 8 ta belgi",
    active: "Faol",
    disabled: "O'chirilgan",
    createdAt: "Yaratilgan sana",
    actions: "Amallar",
    create: "Yaratish",
    creating: "Yaratilmoqda...",
    disable: "O'chirish",
    activate: "Faollashtirish",
    resetPassword: "Parolni yangilash",
    resettingPassword: "Yangilanmoqda...",
    newPasswordPlaceholder: "Yangi vaqtinchalik parol",
    empty: "Hali foydalanuvchi yo'q.",
    success: "Ma'lumot saqlandi",
  },
  teachers: {
    metaTitle: "Ustozlar",
    title: "Ustozlar",
    description:
      "Administratorlar bu yerda ustoz hisoblarini yaratadi va ularning kirish holatini boshqaradi.",
    createTitle: "Yangi ustoz",
    listTitle: "Ustozlar ro'yxati",
    submit: "Ustoz yaratish",
    created: "Ustoz hisobi yaratildi",
  },
  students: {
    metaTitle: "O'quvchilar",
    title: "O'quvchilar",
    description:
      "Ustozlar bu yerda o'quvchi hisoblarini yaratadi. Guruhga biriktirish keyingi bosqichda qo'shiladi.",
    createTitle: "Yangi o'quvchi",
    listTitle: "O'quvchilar ro'yxati",
    submit: "O'quvchi yaratish",
    created: "O'quvchi hisobi yaratildi",
  },
  errors: {
    duplicateUsername: "Bu login allaqachon band",
    invalidData: "Ma'lumotlarni tekshiring",
    passwordTooShort: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak",
    unknown: "Amal bajarilmadi. Qayta urinib ko'ring",
  },
} as const;

export const groupManagementDictionary = {
  metaTitle: "Guruhlar",
  title: "Guruhlar",
  studentTitle: "Mening guruhlarim",
  description:
    "Ustozlar bu yerda yopiq sinfxonalar yaratadi va o'quvchilarni guruhlarga biriktiradi.",
  studentDescription:
    "Bu yerda sizga biriktirilgan yopiq sinfxonalar ko'rinadi.",
  createTitle: "Yangi guruh",
  listTitle: "Guruhlar ro'yxati",
  name: "Guruh nomi",
  namePlaceholder: "Masalan: Ingliz tili A1",
  descriptionLabel: "Qisqa izoh",
  descriptionPlaceholder: "Guruh haqida qisqa ma'lumot",
  create: "Guruh yaratish",
  creating: "Yaratilmoqda...",
  created: "Guruh yaratildi",
  members: "A'zolar",
  teacher: "Ustoz",
  students: "O'quvchilar",
  noStudents: "Hali o'quvchi biriktirilmagan.",
  addStudent: "O'quvchi qo'shish",
  remove: "Olib tashlash",
  openChat: "Chatni ochish",
  chooseStudent: "O'quvchini tanlang",
  empty: "Hali guruh yo'q.",
  chatEnabled: "Chat yoqilgan",
  active: "Faol",
  errors: {
    invalidData: "Ma'lumotlarni tekshiring",
  },
} as const;

export const chatDictionary = {
  metaTitle: "Guruh chati",
  title: "Guruh chati",
  live: "Jonli chat",
  teacher: "Ustoz",
  members: "A'zolar",
  empty: "Hali xabar yo'q. Birinchi xabarni yuboring.",
  inputLabel: "Xabar",
  inputPlaceholder: "Xabar yozing...",
  attachment: "Fayl",
  attachmentHint: "PDF, rasm, hujjat yoki audio",
  recordVoice: "Ovoz yozish",
  stopRecording: "To'xtatish",
  voiceReady: "Ovoz tayyor",
  fileMessage: "Fayl yuborildi",
  voiceMessage: "Ovozli xabar",
  download: "Yuklash",
  playAudio: "Ovozli xabarni eshitish",
  pin: "Pin qilish",
  unpin: "Pindan olish",
  pinned: "Pinlangan xabarlar",
  noPinned: "Hali pinlangan xabar yo'q.",
  send: "Yuborish",
  sending: "Yuborilmoqda...",
  refresh: "Yangilash",
  streamStatus: {
    connected: "Jonli ulanish faol",
    connecting: "Jonli ulanish tekshirilmoqda",
    disconnected: "Jonli ulanish uzildi",
  },
  errors: {
    invalidData: "Xabarni tekshiring",
    invalidFile: "Fayl turi yoki hajmi mos emas",
    notAllowed: "Bu guruhga xabar yuborish uchun ruxsat yo'q",
    notFound: "Guruh topilmadi yoki sizga biriktirilmagan",
  },
} as const;

export const announcementDictionary = {
  createTitle: "Yangi e'lon",
  titlePlaceholder: "E'lon sarlavhasi",
  bodyPlaceholder: "E'lon matni",
  create: "E'lon qilish",
  creating: "E'lon qilinmoqda...",
  created: "E'lon yuborildi",
  listTitle: "E'lonlar",
  empty: "Hali e'lon yo'q.",
  errors: {
    invalidData: "E'lon ma'lumotlarini tekshiring",
    notAllowed: "Bu guruhga e'lon yuborish uchun ruxsat yo'q",
  },
} as const;

export const assignmentDictionary = {
  metaTitle: "Topshiriqlar",
  title: "Topshiriqlar",
  studentTitle: "Mening topshiriqlarim",
  createTitle: "Yangi topshiriq",
  chooseGroup: "Guruhni tanlang",
  titlePlaceholder: "Topshiriq nomi",
  descriptionPlaceholder: "Topshiriq tavsifi",
  create: "Topshiriq yaratish",
  creating: "Yaratilmoqda...",
  created: "Topshiriq yaratildi",
  submit: "Topshirish",
  submitting: "Topshirilmoqda...",
  submitted: "Topshiriq yuborildi",
  answerPlaceholder: "Javobingizni yozing",
  submissions: "Javoblar",
  grade: "Baho",
  feedback: "Izoh",
  saveGrade: "Baholash",
  noAssignments: "Hali topshiriq yo'q.",
  noSubmissions: "Hali javob yo'q.",
  dueAt: "Muddat",
  statusSubmitted: "Topshirildi",
  statusGraded: "Baholandi",
  errors: {
    invalidData: "Topshiriq ma'lumotlarini tekshiring",
    notAllowed: "Bu topshiriq uchun ruxsat yo'q",
  },
} as const;

export const testDictionary = {
  metaTitle: "Testlar",
  title: "Testlar",
  studentTitle: "Mening testlarim",
  createTitle: "Yangi test",
  chooseGroup: "Guruhni tanlang",
  titlePlaceholder: "Test nomi",
  descriptionPlaceholder: "Qisqa izoh",
  questionPlaceholder: "Savol matni",
  optionA: "A javobi",
  optionB: "B javobi",
  optionC: "C javobi",
  optionD: "D javobi",
  correctAnswer: "To'g'ri javob",
  create: "Test yaratish",
  creating: "Yaratilmoqda...",
  created: "Test yaratildi",
  questions: "Savollar",
  attempts: "Natijalar",
  noTests: "Hali test yo'q.",
  noAttempts: "Hali natija yo'q.",
  submit: "Testni yakunlash",
  score: "Natija",
  completed: "Yakunlandi",
  errors: {
    invalidData: "Test ma'lumotlarini tekshiring",
    notAllowed: "Bu test uchun ruxsat yo'q",
  },
} as const;

export const notificationDictionary = {
  metaTitle: "Bildirishnomalar",
  title: "Bildirishnomalar",
  description: "Guruhlaringizdagi muhim yangiliklar shu yerda jamlanadi.",
  markAllRead: "Hammasini o'qilgan qilish",
  empty: "Hali bildirishnoma yo'q.",
  unread: "Yangi",
  read: "O'qilgan",
  open: "Ochish",
  kinds: {
    ANNOUNCEMENT: "E'lon",
    ASSIGNMENT: "Topshiriq",
    TEST: "Test",
    MESSAGE: "Xabar",
    SYSTEM: "Tizim",
  },
} as const;

export const reportDictionary = {
  metaTitle: "Hisobotlar",
  title: "Hisobotlar",
  adminDescription: "Markaz bo'yicha asosiy faollik va o'sish ko'rsatkichlari.",
  teacherDescription: "Guruhlaringiz bo'yicha topshiriq, test va chat faolligi.",
  teachers: "Ustozlar",
  students: "O'quvchilar",
  groups: "Guruhlar",
  messages: "Xabarlar",
  assignments: "Topshiriqlar",
  submissions: "Javoblar",
  tests: "Testlar",
  attempts: "Test natijalari",
  notifications: "Bildirishnomalar",
  activeGroups: "Faol guruhlar",
  recentActivity: "So'nggi faollik",
  noActivity: "Hali faollik yo'q.",
  auditActions: {
    LOGIN_SUCCEEDED: "Hisobga kirdi",
    LOGIN_FAILED: "Kirish urinishi rad etildi",
    LOGOUT: "Hisobdan chiqdi",
    SESSION_REVOKED: "Sessiya bekor qilindi",
    USER_CREATED: "Foydalanuvchi yaratildi",
    USER_DISABLED: "Foydalanuvchi o'chirildi",
    USER_ENABLED: "Foydalanuvchi faollashtirildi",
    USER_PASSWORD_RESET: "Parol yangilandi",
    GROUP_CREATED: "Guruh yaratildi",
    GROUP_UPDATED: "Guruh yangilandi",
    GROUP_MEMBER_ADDED: "Guruhga a'zo qo'shildi",
    GROUP_MEMBER_REMOVED: "Guruhdan a'zo olindi",
    MESSAGE_PINNED: "Xabar pin qilindi",
    MESSAGE_UNPINNED: "Xabar pindan olindi",
    ANNOUNCEMENT_CREATED: "E'lon yaratildi",
    ASSIGNMENT_CREATED: "Topshiriq yaratildi",
    ASSIGNMENT_SUBMITTED: "Topshiriq topshirildi",
    ASSIGNMENT_GRADED: "Topshiriq baholandi",
    TEST_CREATED: "Test yaratildi",
    TEST_SUBMITTED: "Test topshirildi",
    AI_REQUEST_CREATED: "AI so'rovi yaratildi",
  },
} as const;

export const unauthorizedDictionary = {
  title: "Ruxsat yo'q",
  description:
    "Bu sahifani ochish uchun hisobingizda yetarli ruxsat yo'q. Kerak bo'lsa, markaz administratori bilan bog'laning.",
  backToPanel: "Panelga qaytish",
  login: "Kirish",
} as const;
