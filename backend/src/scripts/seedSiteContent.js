/**
 * Seed script for SiteContent table.
 *
 * Run:  node src/scripts/seedSiteContent.js
 *
 * This populates the site_contents table with production-ready content
 * for all public website sections.  It uses upsert semantics so it is
 * safe to run multiple times — existing rows are updated, new ones are
 * inserted, and rows that are no longer in the seed are left in place.
 */
const { Op } = require('sequelize');
const { sequelize, SiteContent } = require('../models');

const SEED_DATA = [
  // ── Hero ───────────────────────────────────────────────────────────────
  {
    section: 'hero',
    key: 'main',
    sort_order: 0,
    data: {
      title: 'Dwaraka Academy',
      subtitle: 'Excellence in Education Since 2020',
      headline: 'Admissions Open',
      description: 'Empowering students with quality education through expert faculty, personalized attention, and proven results. Your journey to academic excellence begins here.',
      tags: ['CBSE', 'JEE', 'NEET'],
      highlights: ['Quality Education', 'Experienced Faculty', 'Excellent Results', 'Individual Attention'],
      stats: [
        { label: 'Students Taught', value: 2000, suffix: '+' },
        { label: 'Expert Faculty', value: 25, suffix: '+' },
        { label: 'Years of Excellence', value: 14, suffix: '+' },
        { label: 'Success Rate', value: 98, suffix: '%' },
      ],
    },
  },

  // ── About ──────────────────────────────────────────────────────────────
  {
    section: 'about',
    key: 'main',
    sort_order: 0,
    data: {
      title: 'About Dwaraka Academy',
      subtitle: 'Our Story',
      description: 'Dwaraka Academy is a premier educational institution dedicated to shaping the future of students through comprehensive coaching for CBSE, JEE, and NEET examinations.',
      extendedDescription: 'Since our establishment in 2020, we have been committed to providing quality education that goes beyond textbooks. Our experienced faculty, innovative teaching methods, and student-centric approach ensure every learner achieves their full potential.',
      yearsOfExcellence: 14,
      directorMessage: '"At Dwaraka Academy, we believe every student has the potential to excel. Our mission is to nurture that potential through quality education, dedicated mentorship, and a supportive learning environment that encourages growth, curiosity, and academic excellence."',
      directorName: 'Ram Kumar',
      directorTitle: 'Founder & Director',
      mission: 'To nurture academic excellence and build confident, successful individuals.',
      vision: 'To be the most trusted and transformative educational academy in the region.',
      values: 'Integrity, innovation, inclusivity, and unwavering commitment to student success.',
    },
  },

  // ── Timeline ───────────────────────────────────────────────────────────
  ...([
    { year: '2020', desc: 'Founded with a vision to transform education' },
    { year: '2021', desc: 'Launched CBSE coaching for Classes 6-12' },
    { year: '2022', desc: 'Expanded to JEE & NEET coaching programs' },
    { year: '2023', desc: 'First batch achieved 95%+ results in Board exams' },
    { year: '2024', desc: '500+ students enrolled, introduced digital learning' },
    { year: '2025', desc: 'Recognized as top coaching institute in the region' },
  ]).map((m, i) => ({
    section: 'timeline',
    key: `milestone-${i + 1}`,
    sort_order: i,
    data: { year: m.year, description: m.desc },
  })),

  // ── Why Choose Us ──────────────────────────────────────────────────────
  ...([
    { title: 'Experienced Faculty', desc: 'Learn from highly qualified teachers with years of experience', icon: 'Award' },
    { title: 'Personal Attention', desc: 'Individual focus on every student\'s learning journey', icon: 'Users' },
    { title: 'Weekly Tests', desc: 'Regular assessments to track and improve performance', icon: 'ScrollText' },
    { title: 'Performance Analysis', desc: 'Detailed analytics to identify strengths and areas for growth', icon: 'BarChart3' },
    { title: 'Digital Learning', desc: 'Modern smart classrooms with digital teaching tools', icon: 'Monitor' },
    { title: 'Small Batch Size', desc: 'Limited students per batch for effective learning', icon: 'Users' },
    { title: 'Concept Based Teaching', desc: 'Deep understanding of fundamentals and concepts', icon: 'Brain' },
    { title: 'Board Exam Preparation', desc: 'Comprehensive preparation for CBSE board examinations', icon: 'ScrollText' },
    { title: 'JEE Preparation', desc: 'Dedicated coaching for JEE Main and Advanced', icon: 'Brain' },
    { title: 'NEET Preparation', desc: 'Focused preparation for NEET medical entrance', icon: 'FlaskConical' },
    { title: 'Exam Preparation', desc: 'Comprehensive preparation for all competitive exams', icon: 'Target' },
  ]).map((w, i) => ({
    section: 'why-us',
    key: `reason-${i + 1}`,
    sort_order: i,
    data: { title: w.title, description: w.desc, icon: w.icon },
  })),

  // ── Courses ────────────────────────────────────────────────────────────
  ...([
    {
      title: 'CBSE Coaching', grades: 'Classes 6–12', color: 'from-purple-600 to-purple-800',
      description: 'Comprehensive coaching for CBSE students from Class 6 to 12 with focus on conceptual clarity and exam-oriented preparation.',
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi/Sanskrit'],
      eligibility: 'Students from Class 6 to 12',
      batchTimings: ['Morning: 6:00 AM - 8:00 AM', 'Evening: 4:00 PM - 6:00 PM'],
      features: ['Board Exam Preparation', 'Weekly Tests', 'Concept Based Learning', 'Personal Attention'],
      gradient: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', shadow: 'shadow-purple-500/10',
    },
    {
      title: 'JEE Coaching', grades: 'JEE Main & Advanced', color: 'from-amber-500 to-orange-600',
      description: 'Intensive JEE preparation program covering all aspects of JEE Main and Advanced with dedicated problem-solving sessions.',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      eligibility: 'Class 11 & 12 students / 12th Pass',
      batchTimings: ['Morning: 5:30 AM - 8:30 AM', 'Evening: 3:30 PM - 6:30 PM'],
      features: ['JEE Main Preparation', 'JEE Advanced Foundation', 'Problem Solving Sessions', 'Mock Tests'],
      gradient: 'from-amber-500/20 to-orange-600/5', border: 'border-amber-500/20', shadow: 'shadow-amber-500/10',
    },
    {
      title: 'NEET Coaching', grades: 'Medical Entrance', color: 'from-emerald-500 to-emerald-700',
      description: 'Comprehensive NEET coaching with focused preparation in Physics, Chemistry, and Biology through daily practice and mock exams.',
      subjects: ['Physics', 'Chemistry', 'Biology (Botany + Zoology)'],
      eligibility: 'Class 11 & 12 students / 12th Pass',
      batchTimings: ['Morning: 5:30 AM - 8:30 AM', 'Evening: 3:30 PM - 6:30 PM'],
      features: ['Physics, Chemistry, Biology', 'Mock Exams', 'Daily Practice Sessions', 'Doubt Clearing'],
      gradient: 'from-emerald-500/20 to-emerald-700/5', border: 'border-emerald-500/20', shadow: 'shadow-emerald-500/10',
    },
  ]).map((c, i) => ({
    section: 'courses',
    key: `course-${i + 1}`,
    sort_order: i,
    data: c,
  })),

  // ── Faculty ────────────────────────────────────────────────────────────
  ...([
    { name: 'Dr. Rajesh Kumar', subject: 'Physics', specialization: 'Mechanics & Electrodynamics', qualification: 'Ph.D, IIT Delhi', experience: '15+ Years' },
    { name: 'Mrs. Sunita Sharma', subject: 'Chemistry', specialization: 'Organic & Physical Chemistry', qualification: 'M.Sc, B.Ed', experience: '12+ Years' },
    { name: 'Mr. Anil Verma', subject: 'Mathematics', specialization: 'Algebra & Calculus', qualification: 'M.Sc, NET Qualified', experience: '10+ Years' },
    { name: 'Dr. Priya Singh', subject: 'Biology', specialization: 'Genetics & Cell Biology', qualification: 'Ph.D, AIIMS', experience: '8+ Years' },
    { name: 'Mr. Vikram Patel', subject: 'English', specialization: 'Literature & Grammar', qualification: 'M.A, B.Ed', experience: '14+ Years' },
    { name: 'Ms. Neha Gupta', subject: 'Chemistry', specialization: 'Inorganic Chemistry', qualification: 'M.Sc, Ph.D', experience: '9+ Years' },
  ]).map((f, i) => ({
    section: 'faculty',
    key: `faculty-${i + 1}`,
    sort_order: i,
    data: f,
  })),

  // ── Student Results ────────────────────────────────────────────────────
  ...([
    { name: 'Arjun Sharma', school: 'KV School', percentage: 98.4, year: 2024, achievement: 'CBSE Class 12 Topper', category: 'CBSE' },
    { name: 'Priya Verma', school: 'DAV Public School', percentage: 97.6, year: 2024, achievement: 'CBSE Class 10 Topper', category: 'CBSE' },
    { name: 'Rahul Patel', school: 'Delhi Public School', percentage: 96.8, year: 2024, achievement: 'JEE Advanced AIR 247', category: 'JEE' },
    { name: 'Kavya Reddy', school: 'Sri Chaitanya', percentage: 95.2, year: 2024, achievement: 'NEET Qualifier - 680 Marks', category: 'NEET' },
    { name: 'Amit Singh', school: 'KV School', percentage: 98.2, year: 2023, achievement: 'CBSE Class 12 Topper', category: 'CBSE' },
    { name: 'Sneha Gupta', school: 'DAV Public School', percentage: 97.4, year: 2023, achievement: 'CBSE Class 10 Topper', category: 'CBSE' },
    { name: 'Vikram Joshi', school: 'JNV School', percentage: 93.6, year: 2023, achievement: 'JEE Advanced AIR 512', category: 'JEE' },
    { name: 'Neha Sharma', school: "St. Mary's School", percentage: 94.8, year: 2023, achievement: 'NEET Qualifier - 650 Marks', category: 'NEET' },
    { name: 'Rohit Kumar', school: 'KV School', percentage: 98.6, year: 2022, achievement: 'CBSE Class 12 Topper', category: 'CBSE' },
    { name: 'Anjali Patel', school: 'DAV Public School', percentage: 97.2, year: 2022, achievement: 'CBSE Class 10 Topper', category: 'CBSE' },
    { name: 'Deepak Verma', school: 'Delhi Public School', percentage: 92.4, year: 2022, achievement: 'JEE Advanced AIR 823', category: 'JEE' },
    { name: 'Pooja Reddy', school: 'Sri Chaitanya', percentage: 93.6, year: 2022, achievement: 'NEET Qualifier - 620 Marks', category: 'NEET' },
  ]).map((r, i) => ({
    section: 'student-results',
    key: `result-${i + 1}`,
    sort_order: i,
    data: r,
  })),

  // ── Testimonials ───────────────────────────────────────────────────────
  ...([
    { name: 'Mr. Suresh Patel', role: 'Parent of Class 10 Student', childClass: 'Class 10', text: 'Dwaraka Academy has been instrumental in my child\'s academic growth. The teachers are dedicated and the personalised attention is remarkable.', rating: 5 },
    { name: 'Rahul Sharma', role: 'JEE Advanced 2024 Topper', childClass: 'JEE Batch', text: 'The rigorous training and concept-based teaching at Dwaraka Academy helped me clear JEE Advanced with flying colours.', rating: 5 },
    { name: 'Mrs. Anjali Mehta', role: 'Parent of Class 12 Student', childClass: 'Class 12', text: 'My daughter improved significantly after joining Dwaraka Academy. The weekly tests and performance analysis kept us updated.', rating: 5 },
    { name: 'Kavya Reddy', role: 'NEET 2024 Qualifier', childClass: 'NEET Batch', text: 'The structured curriculum and mock tests at Dwaraka Academy prepared me thoroughly for NEET.', rating: 5 },
    { name: 'Mr. Amit Joshi', role: 'Parent of Class 8 Student', childClass: 'Class 8', text: 'Excellent academy with modern teaching methods. My son enjoys learning here and his grades have improved tremendously.', rating: 5 },
    { name: 'Arjun Singh', role: 'CBSE Class 12 Topper', childClass: 'CBSE Batch', text: 'Dwaraka Academy provided me with the perfect environment to excel. The teachers are supportive and the study material is top-notch.', rating: 5 },
  ]).map((t, i) => ({
    section: 'testimonials',
    key: `testimonial-${i + 1}`,
    sort_order: i,
    data: t,
  })),

  // ── Gallery ────────────────────────────────────────────────────────────
  ...([
    { src: '/images/academy/hero-academy.svg', alt: 'Dwaraka Academy Building', label: 'Academy Building', category: 'Classroom' },
    { src: '/images/academy/about-academy.svg', alt: 'Dwaraka Academy Academics', label: 'Academic Excellence', category: 'Classroom' },
    { src: '/images/academy/gallery-1.svg', alt: 'Dwaraka Academy Campus', label: 'Campus Life', category: 'Events' },
    { src: '/images/academy/gallery-2.svg', alt: 'Dwaraka Academy Learning', label: 'Learning Environment', category: 'Classroom' },
  ]).map((g, i) => ({
    section: 'gallery',
    key: `image-${i + 1}`,
    sort_order: i,
    data: g,
  })),

  // ── Downloads ──────────────────────────────────────────────────────────
  ...([
    { title: 'Academy Prospectus', description: 'Complete guide about courses, fee structure, and facilities.', icon: 'BookOpen', color: 'from-purple-500 to-purple-700' },
    { title: 'Fee Structure', description: 'Detailed fee structure for all courses and batches.', icon: 'ScrollText', color: 'from-amber-500 to-orange-600' },
    { title: 'Class Timetable', description: 'Current academic year class schedules and batch timings.', icon: 'Clock', color: 'from-blue-500 to-blue-700' },
    { title: 'Study Notes', description: 'Chapter-wise study notes and revision materials.', icon: 'BookOpen', color: 'from-emerald-500 to-emerald-700' },
    { title: 'Question Papers', description: 'Previous year question papers for practice.', icon: 'Brain', color: 'from-red-500 to-red-700' },
  ]).map((d, i) => ({
    section: 'downloads',
    key: `download-${i + 1}`,
    sort_order: i,
    data: d,
  })),

  // ── Contact ────────────────────────────────────────────────────────────
  {
    section: 'contact',
    key: 'main',
    sort_order: 0,
    data: {
      address: '12-2-711/A/75, Site 2, LIC Colony, Mehdipatnam, Hyderabad - 500028',
      phone: '+91 9030698785',
      email: 'info@dwarakaacademy.com',
      workingHours: 'Mon–Sat: 6:00 AM – 8:00 PM',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.123456789!2d78.442!3d17.395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sDwaraka+Academy!5e0!3m2!1sen!2sin!4v1',
      whatsapp: '+919030698785',
    },
  },

  // ── Settings ───────────────────────────────────────────────────────────
  {
    section: 'settings',
    key: 'general',
    sort_order: 0,
    data: {
      academyName: 'Dwaraka Academy',
      tagline: 'Excellence in Education',
      foundedYear: 2020,
      theme: { primary: '#7C3AED', secondary: '#F59E0B' },
      socialLinks: {
        facebook: '#',
        twitter: '#',
        instagram: '#',
        youtube: '#',
      },
    },
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // Ensure the SiteContent table exists
    await sequelize.sync();
    console.log('Tables synced.');

    let created = 0;
    let updated = 0;

    for (const item of SEED_DATA) {
      const existing = await SiteContent.findOne({
        where: { section: item.section, key: item.key },
      });

      if (existing) {
        await existing.update({ data: item.data, sort_order: item.sort_order });
        updated++;
      } else {
        await SiteContent.create(item);
        created++;
      }
    }

    console.log(`Seeding complete: ${created} created, ${updated} updated.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
