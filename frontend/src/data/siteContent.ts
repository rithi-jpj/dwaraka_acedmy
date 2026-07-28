// ─── Site Content Data ─────────────────────────────────────────────────
// All hardcoded content lives here so the public page imports from one source.
// When a database-backed content management module is added, swap this
// import for an API call — the component interfaces stay the same.

// ─── Courses ────────────────────────────────────────────────────────────
export interface Course {
  title: string;
  grades: string;
  icon: string;
  color: string;
  description: string;
  subjects: string[];
  eligibility: string;
  batchTimings: string[];
  features: string[];
  gradient: string;
  border: string;
  shadow: string;
}

// ─── Faculty Member ─────────────────────────────────────────────────────
export interface FacultyMember {
  name: string;
  qualification: string;
  experience: string;
  subjects: string;
  specialization: string;
  photo: string;
  initials: string;
}

// ─── Student Result ─────────────────────────────────────────────────────
export interface StudentResult {
  name: string;
  photo: string;
  initials: string;
  school: string;
  percentage: number;
  year: number;
  achievement: string;
  category: 'cbse' | 'neet' | 'jee';
}

// ─── Testimonial ────────────────────────────────────────────────────────
export interface Testimonial {
  name: string;
  childClass: string;
  review: string;
  rating: number;
  photo: string;
  initials: string;
  color: string;
}

// ─── Gallery Image ──────────────────────────────────────────────────────
export interface GalleryImage {
  src: string;
  alt: string;
  category: 'classroom' | 'events' | 'results' | 'activities' | 'annual-day';
}

// ─── Download Item ──────────────────────────────────────────────────────
export interface DownloadItem {
  title: string;
  description: string;
  icon: string;
  url: string;
}

// ─── Contact Info ───────────────────────────────────────────────────────
export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  googleMapsEmbed: string;
  whatsapp: string;
}

// ═══════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════

export const CONTACT_INFO: ContactInfo = {
  address: '12-2-711/A/75, Site 2, LIC Colony, Mehdipatnam, Hyderabad - 500028',
  phone: '+91 9030698785',
  email: 'info@dwarakaacademy.com',
  workingHours: 'Mon–Sat: 6:00 AM – 8:00 PM',
  googleMapsEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.123456789!2d78.442!3d17.395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sDwaraka+Academy!5e0!3m2!1sen!2sin!4v1',
  whatsapp: '+919030698785',
};

export const ACADEMY_STORY =
  'Dwaraka Academy was founded with a vision to provide quality education that goes beyond textbooks. Over the past six years, we have nurtured hundreds of students, helping them achieve academic excellence and personal growth. Our journey began with a small group of dedicated educators and has grown into a thriving learning community that prepares students for CBSE board exams, JEE, NEET, and beyond.';

export const DIRECTOR_MESSAGE =
  'At Dwaraka Academy, we believe every student has the potential to achieve greatness. Our mission is to unlock that potential through personalized attention, rigorous academic training, and a nurturing environment. I invite you to join us on this journey of excellence.';

export const TIMELINE = [
  { year: '2020', label: 'Academy Founded', desc: 'Started with 20 students and 3 teachers' },
  { year: '2021', label: 'CBSE Program Launch', desc: 'Expanded to full CBSE curriculum for Classes 6–12' },
  { year: '2022', label: 'NEET/JEE Program', desc: 'Launched competitive exam coaching programs' },
  { year: '2023', label: '100+ Students', desc: 'Crossed 100 enrolled students milestone' },
  { year: '2024', label: 'Results Peak', desc: 'Record-breaking board exam and entrance results' },
  { year: '2025', label: 'Continued Excellence', desc: 'Expanding facilities and introducing new programs' },
];

export const FACULTY: FacultyMember[] = [
  {
    name: 'Dr. Rakesh Sharma',
    qualification: 'Ph.D. in Physics, 15+ years experience',
    experience: '15+ years',
    subjects: 'Physics (JEE/NEET)',
    specialization: 'Electrodynamics & Quantum Mechanics',
    photo: '/images/faculty/faculty-1.svg',
    initials: 'RS',
  },
  {
    name: 'Ms. Priya Singh',
    qualification: 'M.Sc. Chemistry, B.Ed.',
    experience: '10+ years',
    subjects: 'Chemistry (JEE/NEET)',
    specialization: 'Organic Chemistry & Chemical Bonding',
    photo: '/images/faculty/faculty-2.svg',
    initials: 'PS',
  },
  {
    name: 'Mr. Arun Kumar',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    experience: '12+ years',
    subjects: 'Mathematics (CBSE/JEE)',
    specialization: 'Calculus & Coordinate Geometry',
    photo: '/images/faculty/faculty-3.svg',
    initials: 'AK',
  },
  {
    name: 'Dr. Sneha Reddy',
    qualification: 'Ph.D. in Botany, M.Sc. Zoology',
    experience: '8+ years',
    subjects: 'Biology (NEET)',
    specialization: 'Genetics & Human Physiology',
    photo: '/images/faculty/faculty-4.svg',
    initials: 'SR',
  },
  {
    name: 'Ms. Anjali Gupta',
    qualification: 'M.A. English, B.Ed.',
    experience: '10+ years',
    subjects: 'English (CBSE)',
    specialization: 'Grammar & Literature Analysis',
    photo: '/images/faculty/faculty-5.svg',
    initials: 'AG',
  },
  {
    name: 'Mr. Vikram Joshi',
    qualification: 'M.A. History, B.Ed.',
    experience: '9+ years',
    subjects: 'Social Studies (CBSE)',
    specialization: 'Modern Indian History & Political Science',
    photo: '/images/faculty/faculty-6.svg',
    initials: 'VJ',
  },
];

export const STUDENT_RESULTS: StudentResult[] = [
  { name: 'Aarav Mehta', photo: '', initials: 'AM', school: 'Dwaraka Academy', percentage: 96.8, year: 2025, achievement: 'CBSE Class 12 — School Topper', category: 'cbse' },
  { name: 'Sanya Patel', photo: '', initials: 'SP', school: 'Dwaraka Academy', percentage: 95.2, year: 2025, achievement: 'CBSE Class 12 — 2nd Rank', category: 'cbse' },
  { name: 'Rahul Verma', photo: '', initials: 'RV', school: 'Dwaraka Academy', percentage: 94.6, year: 2025, achievement: 'CBSE Class 10 — School Topper', category: 'cbse' },
  { name: 'Priya Sharma', photo: '', initials: 'PS', school: 'Dwaraka Academy', percentage: 97.2, year: 2025, achievement: 'NEET 2025 — Medical Seat', category: 'neet' },
  { name: 'Arjun Nair', photo: '', initials: 'AN', school: 'Dwaraka Academy', percentage: 96.4, year: 2025, achievement: 'NEET 2025 — 670+ Score', category: 'neet' },
  { name: 'Neha Gupta', photo: '', initials: 'NG', school: 'Dwaraka Academy', percentage: 95.8, year: 2025, achievement: 'NEET 2025 — 660+ Score', category: 'neet' },
  { name: 'Karthik Iyer', photo: '', initials: 'KI', school: 'Dwaraka Academy', percentage: 98.1, year: 2025, achievement: 'JEE Advanced 2025 — 99.8%ile', category: 'jee' },
  { name: 'Divya Reddy', photo: '', initials: 'DR', school: 'Dwaraka Academy', percentage: 97.5, year: 2025, achievement: 'JEE Main 2025 — 99.7%ile', category: 'jee' },
  { name: 'Rohit Singh', photo: '', initials: 'RS', school: 'Dwaraka Academy', percentage: 96.2, year: 2025, achievement: 'JEE Advanced 2025 — 99.5%ile', category: 'jee' },
  { name: 'Ananya Joshi', photo: '', initials: 'AJ', school: 'Dwaraka Academy', percentage: 93.8, year: 2024, achievement: 'CBSE Class 12 — 93.8%', category: 'cbse' },
  { name: 'Vivek Kumar', photo: '', initials: 'VK', school: 'Dwaraka Academy', percentage: 92.4, year: 2024, achievement: 'CBSE Class 10 — 92.4%', category: 'cbse' },
  { name: 'Kavya Sharma', photo: '', initials: 'KS', school: 'Dwaraka Academy', percentage: 91.6, year: 2024, achievement: 'CBSE Class 12 — 91.6%', category: 'cbse' },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Mrs. Lakshmi Devi',
    childClass: 'Class 12 — CBSE',
    review: 'Dwaraka Academy has been instrumental in my child\'s academic journey. The teachers are incredibly dedicated and provide personalized attention. My daughter improved from average grades to becoming a school topper!',
    rating: 5,
    photo: '',
    initials: 'LD',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Mr. Suresh Babu',
    childClass: 'NEET Coaching',
    review: 'The NEET coaching at Dwaraka Academy is outstanding. The systematic approach to covering the syllabus, regular mock tests, and doubt-clearing sessions helped my son secure a medical seat. Highly recommended!',
    rating: 5,
    photo: '',
    initials: 'SB',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Mrs. Radhika Reddy',
    childClass: 'JEE Coaching',
    review: 'My son joined Dwaraka Academy for JEE preparation in Class 11. The faculty\'s expertise in mathematics and physics is remarkable. He scored 99.7 percentile in JEE Main. Thank you, Dwaraka team!',
    rating: 5,
    photo: '',
    initials: 'RR',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Mr. Venkatesh Rao',
    childClass: 'Class 10 — CBSE',
    review: 'The transition to online learning during the pandemic was seamless at Dwaraka Academy. My daughter continued to excel despite the challenges. The academy truly cares about student well-being.',
    rating: 5,
    photo: '',
    initials: 'VR',
    color: 'from-orange-500 to-rose-500',
  },
  {
    name: 'Mrs. Sunita Sharma',
    childClass: 'Class 9 — CBSE',
    review: 'My son has been at Dwaraka Academy for three years now. The improvement in his confidence and academic performance has been remarkable. The regular parent-teacher meetings keep us well-informed.',
    rating: 5,
    photo: '',
    initials: 'SS',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    name: 'Mr. Ravi Teja',
    childClass: 'Class 6 — CBSE',
    review: 'Both my children study at Dwaraka Academy. The foundation built in the early classes is excellent. The teachers focus on conceptual clarity rather than rote learning. Truly a great institution!',
    rating: 5,
    photo: '',
    initials: 'RT',
    color: 'from-pink-500 to-rose-500',
  },
];

export const GALLERY_CATEGORIES = ['classroom', 'events', 'results', 'activities', 'annual-day'] as const;

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: '/images/gallery/classroom-1.svg', alt: 'Smart classroom with students', category: 'classroom' },
  { src: '/images/gallery/classroom-2.svg', alt: 'Interactive learning session', category: 'classroom' },
  { src: '/images/gallery/events-1.svg', alt: 'Annual day celebration', category: 'events' },
  { src: '/images/gallery/events-2.svg', alt: 'Science exhibition', category: 'events' },
  { src: '/images/gallery/results-1.svg', alt: 'Toppers celebration', category: 'results' },
  { src: '/images/gallery/results-2.svg', alt: 'Award ceremony', category: 'results' },
  { src: '/images/gallery/activities-1.svg', alt: 'Sports day event', category: 'activities' },
  { src: '/images/gallery/activities-2.svg', alt: 'Cultural program', category: 'activities' },
  { src: '/images/gallery/annual-day-1.svg', alt: 'Annual day performance', category: 'annual-day' },
  { src: '/images/gallery/annual-day-2.svg', alt: 'Graduation ceremony', category: 'annual-day' },
];

export const DOWNLOADS: DownloadItem[] = [
  { title: 'Prospectus', description: 'Complete academy prospectus with course details, fee structure, and admission information.', icon: 'ScrollText', url: '/downloads/prospectus.pdf' },
  { title: 'Fee Structure', description: 'Detailed fee structure for all courses including CBSE, NEET, and JEE programs.', icon: 'FileText', url: '/downloads/fee-structure.pdf' },
  { title: 'Timetable', description: 'Class timetables for all batches — morning and evening sessions.', icon: 'Clock', url: '/downloads/timetable.pdf' },
  { title: 'Study Notes', description: 'Comprehensive study notes covering key concepts for all subjects.', icon: 'BookOpen', url: '/downloads/study-notes.pdf' },
  { title: 'Question Papers', description: 'Previous year question papers for practice and self-assessment.', icon: 'ClipboardCheck', url: '/downloads/question-papers.pdf' },
];
