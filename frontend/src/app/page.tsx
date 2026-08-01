'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronUp, ExternalLink, Star, Quote,
  GraduationCap, BookOpen, Users, Award, Target, TrendingUp,
  Clock, CheckCircle, ArrowRight, Phone, Mail, MapPin,
  ChevronLeft, ChevronRight, Sparkles,
  BarChart3, Monitor, Brain, FlaskConical,
  ScrollText, Send, MessageCircle, Heart, Eye, Globe, Hash, Video, Camera
} from 'lucide-react';
import { SiteDataProvider, useSiteData } from './SiteDataContext';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/Hero';
import Footer from '@/components/Footer';

// ─── Types ───
interface CounterProps {
  end: number;
  suffix?: string;
  label: string;
  icon: React.ReactNode;
  duration?: number;
}

// ─── Constants ───
const NAV_ITEMS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses' },
  { href: '#why-us', label: 'Why Choose Us' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#results', label: 'Results' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#downloads', label: 'Downloads' },
  { href: '#contact', label: 'Contact' },
];

const COURSES = [
  {
    title: 'CBSE Coaching',
    grades: 'Classes 6\u201312',
    icon: <BookOpen className="w-8 h-8" />,
    color: 'from-brand-600 to-brand-800',
    description: 'Comprehensive coaching for CBSE students from Class 6 to 12 with focus on conceptual clarity and exam-oriented preparation.',
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi/Sanskrit'],
    eligibility: 'Students from Class 6 to 12',
    batchTimings: ['Morning: 6:00 AM \u2013 8:00 AM', 'Evening: 4:00 PM \u2013 6:00 PM'],
    features: ['Board Exam Preparation', 'Weekly Tests', 'Concept Based Learning', 'Personal Attention'],
    gradient: 'from-brand-500/20 to-brand-600/5',
    border: 'border-brand-500/20',
    shadow: 'shadow-brand-500/10',
  },
  {
    title: 'JEE Coaching',
    grades: 'JEE Main & Advanced',
    icon: <Brain className="w-8 h-8" />,
    color: 'from-accent-600 to-accent-800',
    description: 'Intensive JEE preparation program covering all aspects of JEE Main and Advanced with dedicated problem-solving sessions.',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    eligibility: 'Class 11 & 12 students / 12th Pass',
    batchTimings: ['Morning: 5:30 AM \u2013 8:30 AM', 'Evening: 3:30 PM \u2013 6:30 PM'],
    features: ['JEE Main Preparation', 'JEE Advanced Foundation', 'Problem Solving Sessions', 'Mock Tests'],
    gradient: 'from-accent-500/20 to-accent-600/5',
    border: 'border-accent-500/20',
    shadow: 'shadow-accent-500/10',
  },
  {
    title: 'NEET Coaching',
    grades: 'Medical Entrance',
    icon: <FlaskConical className="w-8 h-8" />,
    color: 'from-emerald-500 to-emerald-700',
    description: 'Comprehensive NEET coaching with focused preparation in Physics, Chemistry, and Biology through daily practice and mock exams.',
    subjects: ['Physics', 'Chemistry', 'Biology (Botany + Zoology)'],
    eligibility: 'Class 11 & 12 students / 12th Pass',
    batchTimings: ['Morning: 5:30 AM \u2013 8:30 AM', 'Evening: 3:30 PM \u2013 6:30 PM'],
    features: ['Physics, Chemistry, Biology', 'Mock Exams', 'Daily Practice Sessions', 'Doubt Clearing'],
    gradient: 'from-emerald-500/20 to-emerald-700/5',
    border: 'border-emerald-500/20',
    shadow: 'shadow-emerald-500/10',
  },
];

const WHY_CHOOSE_US = [
  { icon: <Award className="w-6 h-6" />, title: 'Experienced Faculty', desc: 'Learn from highly qualified teachers with years of experience' },
  { icon: <Users className="w-6 h-6" />, title: 'Personal Attention', desc: 'Individual focus on every student\u2019s learning journey' },
  { icon: <ScrollText className="w-6 h-6" />, title: 'Weekly Tests', desc: 'Regular assessments to track and improve performance' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Performance Analysis', desc: 'Detailed analytics to identify strengths and areas for growth' },
  { icon: <Monitor className="w-6 h-6" />, title: 'Digital Learning', desc: 'Modern smart classrooms with digital teaching tools' },
  { icon: <Users className="w-6 h-6" />, title: 'Small Batch Size', desc: 'Limited students per batch for effective learning' },
  { icon: <Brain className="w-6 h-6" />, title: 'Concept Based Teaching', desc: 'Deep understanding of fundamentals and concepts' },
  { icon: <ScrollText className="w-6 h-6" />, title: 'Board Exam Preparation', desc: 'Comprehensive preparation for CBSE board examinations' },
  { icon: <Brain className="w-6 h-6" />, title: 'JEE Preparation', desc: 'Dedicated coaching for JEE Main and Advanced' },
  { icon: <FlaskConical className="w-6 h-6" />, title: 'NEET Preparation', desc: 'Focused preparation for NEET medical entrance' },
  { icon: <Target className="w-6 h-6" />, title: 'Exam Preparation', desc: 'Comprehensive preparation for all competitive exams' },
];

const FACULTY = [
  { name: 'Dr. Rajesh Kumar', subject: 'Physics', specialization: 'Mechanics & Electrodynamics', qualification: 'Ph.D, IIT Delhi', experience: '15+ Years' },
  { name: 'Mrs. Sunita Sharma', subject: 'Chemistry', specialization: 'Organic & Physical Chemistry', qualification: 'M.Sc, B.Ed', experience: '12+ Years' },
  { name: 'Mr. Anil Verma', subject: 'Mathematics', specialization: 'Algebra & Calculus', qualification: 'M.Sc, NET Qualified', experience: '10+ Years' },
  { name: 'Dr. Priya Singh', subject: 'Biology', specialization: 'Genetics & Cell Biology', qualification: 'Ph.D, AIIMS', experience: '8+ Years' },
  { name: 'Mr. Vikram Patel', subject: 'English', specialization: 'Literature & Grammar', qualification: 'M.A, B.Ed', experience: '14+ Years' },
  { name: 'Ms. Neha Gupta', subject: 'Chemistry', specialization: 'Inorganic Chemistry', qualification: 'M.Sc, Ph.D', experience: '9+ Years' },
];

const TESTIMONIALS_DATA = [
  { name: 'Mr. Suresh Patel', role: 'Parent of Class 10 Student', childClass: 'Class 10', photo: '/images/testimonials/parent-1.svg', text: 'Dwaraka Academy has been instrumental in my child\u2019s academic growth. The teachers are dedicated and the personalised attention is remarkable.', rating: 5 },
  { name: 'Rahul Sharma', role: 'JEE Advanced 2024 Topper', childClass: 'JEE Batch', photo: '/images/testimonials/student-1.svg', text: 'The rigorous training and concept-based teaching at Dwaraka Academy helped me clear JEE Advanced with flying colours. Grateful for the amazing faculty!', rating: 5 },
  { name: 'Mrs. Anjali Mehta', role: 'Parent of Class 12 Student', childClass: 'Class 12', photo: '/images/testimonials/parent-2.svg', text: 'My daughter improved significantly after joining Dwaraka Academy. The weekly tests and performance analysis kept us updated on her progress.', rating: 5 },
  { name: 'Kavya Reddy', role: 'NEET 2024 Qualifier', childClass: 'NEET Batch', photo: '/images/testimonials/student-2.svg', text: 'The structured curriculum and mock tests at Dwaraka Academy prepared me thoroughly for NEET. The faculty\u2019s guidance was invaluable.', rating: 5 },
  { name: 'Mr. Amit Joshi', role: 'Parent of Class 8 Student', childClass: 'Class 8', photo: '/images/testimonials/parent-3.svg', text: 'Excellent academy with modern teaching methods. My son enjoys learning here and his grades have improved tremendously.', rating: 5 },
  { name: 'Arjun Singh', role: 'CBSE Class 12 Topper', childClass: 'CBSE Batch', photo: '/images/testimonials/student-3.svg', text: 'Dwaraka Academy provided me with the perfect environment to excel. The teachers are supportive and the study material is top-notch.', rating: 5 },
];

const GALLERY_IMAGES = [
  { src: '/images/academy/hero-academy.svg', alt: 'Dwaraka Academy Building', label: 'Academy Building', category: 'Classroom' },
  { src: '/images/academy/about-academy.svg', alt: 'Dwaraka Academy Academics', label: 'Academic Excellence', category: 'Classroom' },
  { src: '/images/academy/gallery-1.svg', alt: 'Dwaraka Academy Campus', label: 'Campus Life', category: 'Events' },
  { src: '/images/academy/gallery-2.svg', alt: 'Dwaraka Academy Learning', label: 'Learning Environment', category: 'Classroom' },
];

const GALLERY_CATEGORIES = ['All', 'Classroom', 'Events', 'Results', 'Activities', 'Annual Day'];

const RESULTS = [
  { end: 25, suffix: '+', label: 'CBSE Board Toppers', icon: <Award className="w-6 h-6" /> },
  { end: 48, suffix: '+', label: 'JEE Advanced Qualifiers', icon: <Brain className="w-6 h-6" /> },
  { end: 35, suffix: '+', label: 'NEET Qualifiers', icon: <FlaskConical className="w-6 h-6" /> },
  { end: 92, suffix: '%', label: 'Above 90% in Boards', icon: <TrendingUp className="w-6 h-6" /> },
];

const STUDENT_RESULTS = [
  { name: 'Arjun Sharma', school: 'KV School', percentage: 98.4, year: 2024, achievement: 'CBSE Class 12 Topper', category: 'CBSE', photo: '' },
  { name: 'Priya Verma', school: 'DAV Public School', percentage: 97.6, year: 2024, achievement: 'CBSE Class 10 Topper', category: 'CBSE', photo: '' },
  { name: 'Rahul Patel', school: 'Delhi Public School', percentage: 96.8, year: 2024, achievement: 'JEE Advanced AIR 247', category: 'JEE', photo: '' },
  { name: 'Kavya Reddy', school: 'Sri Chaitanya', percentage: 95.2, year: 2024, achievement: 'NEET Qualifier \u2013 680 Marks', category: 'NEET', photo: '' },
  { name: 'Amit Singh', school: 'KV School', percentage: 98.2, year: 2023, achievement: 'CBSE Class 12 Topper', category: 'CBSE', photo: '' },
  { name: 'Sneha Gupta', school: 'DAV Public School', percentage: 97.4, year: 2023, achievement: 'CBSE Class 10 Topper', category: 'CBSE', photo: '' },
  { name: 'Vikram Joshi', school: 'JNV School', percentage: 93.6, year: 2023, achievement: 'JEE Advanced AIR 512', category: 'JEE', photo: '' },
  { name: 'Neha Sharma', school: "St. Mary's School", percentage: 94.8, year: 2023, achievement: 'NEET Qualifier \u2013 650 Marks', category: 'NEET', photo: '' },
  { name: 'Rohit Kumar', school: 'KV School', percentage: 98.6, year: 2022, achievement: 'CBSE Class 12 Topper', category: 'CBSE', photo: '' },
  { name: 'Anjali Patel', school: 'DAV Public School', percentage: 97.2, year: 2022, achievement: 'CBSE Class 10 Topper', category: 'CBSE', photo: '' },
  { name: 'Deepak Verma', school: 'Delhi Public School', percentage: 92.4, year: 2022, achievement: 'JEE Advanced AIR 823', category: 'JEE', photo: '' },
  { name: 'Pooja Reddy', school: 'Sri Chaitanya', percentage: 93.6, year: 2022, achievement: 'NEET Qualifier \u2013 620 Marks', category: 'NEET', photo: '' },
];

const DOWNLOADS_DATA = [
  { title: 'Academy Prospectus', description: 'Complete guide about courses, fee structure, and facilities.', icon: <BookOpen className="w-6 h-6" />, color: 'from-brand-600 to-brand-800' },
  { title: 'Fee Structure', description: 'Detailed fee structure for all courses and batches.', icon: <ScrollText className="w-6 h-6" />, color: 'from-accent-600 to-accent-800' },
  { title: 'Class Timetable', description: 'Current academic year class schedules and batch timings.', icon: <Clock className="w-6 h-6" />, color: 'from-brand-500 to-brand-700' },
  { title: 'Study Notes', description: 'Chapter-wise study notes and revision materials.', icon: <BookOpen className="w-6 h-6" />, color: 'from-emerald-500 to-emerald-700' },
  { title: 'Question Papers', description: 'Previous year question papers for practice.', icon: <Brain className="w-6 h-6" />, color: 'from-accent-700 to-accent-900' },
];

// ─── Animated Counter ───
function AnimatedCounter({ end, suffix = '', label, icon, duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isInView, end, duration]);

  return (
    <div ref={ref} className="text-center p-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-400/20 flex items-center justify-center text-brand-400">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">
        {count}{suffix}
      </div>
      <div className="text-sm text-brand-200/70 font-medium">{label}</div>
    </div>
  );
}

// ─── Section Title ───
function SectionTitle({ title, subtitle, light = false }: { title: string; subtitle?: string; light?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="text-center mb-16"
    >
      <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-4 ${light ? 'bg-white/10 text-brand-200 border border-white/10' : 'bg-brand-100 text-brand-700 border border-brand-200'}`}>
        {subtitle || 'Discover'}
      </span>
      <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        {title}
      </h2>
    </motion.div>
  );
}

// ─── Navbar (imported from @/components/Navbar) ───
// Previously inline — now extracted to frontend/src/components/Navbar.tsx

// ─── Hero Section (imported from @/components/Hero) ───
// Previously inline — now extracted to frontend/src/components/Hero.tsx

// ─── About Section ───
function AboutSection() {
  const { data } = useSiteData();
  const about = data.about || {};
  const aboutTimeline = data.timeline && data.timeline.length > 0 ? data.timeline : [
    { year: '2020', description: 'Founded with a vision to transform education' },
    { year: '2021', description: 'Launched CBSE coaching for Classes 6-12' },
    { year: '2022', description: 'Expanded to JEE & NEET coaching programs' },
    { year: '2023', description: 'First batch achieved 95%+ results in Board exams' },
    { year: '2024', description: '500+ students enrolled, introduced digital learning' },
    { year: '2025', description: 'Recognized as top coaching institute in the region' },
  ];
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white">
      <div className="absolute top-0 right-0 -mt-40 -mr-40 w-80 h-80 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/10 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute bottom-0 left-0 -mb-40 -ml-40 w-80 h-80 rounded-full bg-gradient-to-br from-accent-500/20 to-purple-500/10 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2.5s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title={about.title || 'About Dwaraka Academy'} subtitle={about.subtitle || 'Our Story'} />

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-glow-blue">
              <Image
                src="/images/academy/about-academy.svg"
                alt="Dwaraka Academy campus and academic environment"
                width={600}
                height={450}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/40 to-transparent" />
            </div>
            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -bottom-6 -right-6 card-glass rounded-2xl p-5 max-w-[200px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-glow-gold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-navy-900">{about.yearsOfExcellence || 14}+</div>
                  <div className="text-xs text-navy-500">Years of Excellence</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-lg text-navy-600 leading-relaxed">
              {about.description || <><span className="font-bold text-brand-700">Dwaraka Academy</span> is a premier educational institution dedicated to shaping the future of students through comprehensive coaching for CBSE, JEE, and NEET examinations.</>}
            </p>
            <p className="text-navy-600 leading-relaxed">
              {about.extendedDescription || 'Since our establishment in 2020, we have been committed to providing quality education that goes beyond textbooks. Our experienced faculty, innovative teaching methods, and student-centric approach ensure every learner achieves their full potential.'}
            </p>

            {/* Director's Message */}
            <div className="card-glass rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-glow-gold">
                  DK
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">Director&apos;s Message</h3>
                  <p className="text-xs text-navy-500">{about.directorName || 'Ram Kumar'}, {about.directorTitle || 'Founder & Director'}</p>
                </div>
              </div>
              <p className="text-sm text-navy-600 leading-relaxed italic">
                {about.directorMessage || '\u201cAt Dwaraka Academy, we believe every student has the potential to excel. Our mission is to nurture that potential through quality education, dedicated mentorship, and a supportive learning environment that encourages growth, curiosity, and academic excellence.\u201d'}
              </p>
            </div>

            {/* Timeline */}
            <div className="card-glass">
              <h3 className="font-bold text-navy-900 text-sm mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-accent-500" />
                Our Journey \u2014 6 Years of Excellence
              </h3>
              <div className="space-y-3">
                {aboutTimeline.map((milestone, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-accent-400 ring-2 ring-accent-100" />
                      {i < aboutTimeline.length - 1 && <div className="w-0.5 flex-1 bg-accent-200" />}
                    </div>
                    <div className="pb-3">
                      <span className="text-xs font-bold text-accent-600">{milestone.year || milestone.year}</span>
                      <p className="text-xs text-navy-500">{milestone.description || milestone.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: <Target className="w-5 h-5" />, title: 'Our Mission', desc: 'To nurture academic excellence and build confident, successful individuals.' },
                { icon: <Eye className="w-5 h-5" />, title: 'Our Vision', desc: 'To be the most trusted and transformative educational academy in the region.' },
                { icon: <Heart className="w-5 h-5" />, title: 'Our Values', desc: 'Integrity, innovation, inclusivity, and unwavering commitment to student success.' },
              ].map((item, i) => (
                <div key={i} className="card-premium rounded-2xl p-5 group hover:shadow-glow-blue transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-400/20 flex items-center justify-center text-brand-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-navy-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Why Choose Us ───
function WhyChooseUsSection() {
  const { data } = useSiteData();
  const whyUs = data['why-us'] && data['why-us'].length > 0 ? data['why-us'] : WHY_CHOOSE_US;
  const iconMap: Record<string, React.ReactNode> = {
    Award: <Award className="w-6 h-6" />,
    Users: <Users className="w-6 h-6" />,
    ScrollText: <ScrollText className="w-6 h-6" />,
    BarChart3: <BarChart3 className="w-6 h-6" />,
    Monitor: <Monitor className="w-6 h-6" />,
    Brain: <Brain className="w-6 h-6" />,
    FlaskConical: <FlaskConical className="w-6 h-6" />,
    Target: <Target className="w-6 h-6" />,
  };
  return (
    <section id="why-us" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-accent-50/20 to-white">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-to-br from-accent-500/10 to-brand-500/5 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-gradient-to-br from-brand-500/10 to-accent-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-3s' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Why Choose Us" subtitle="Our Strengths" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyUs.map((item: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="card-glass group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-400/20 flex items-center justify-center text-brand-600 mb-4 group-hover:scale-110 group-hover:shadow-glow-blue transition-transform duration-300">
                {typeof item.icon === 'string' ? (iconMap[item.icon] || <Award className="w-6 h-6" />) : item.icon}
              </div>
              <h3 className="font-bold text-navy-900 text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-navy-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Courses Section ───
function CoursesSection() {
  const { data } = useSiteData();
  const courses = data.courses && data.courses.length > 0 ? data.courses : COURSES;
  return (
    <section id="courses" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-white">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-brand-500/15 to-purple-500/10 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-accent-500/10 to-brand-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Our Courses" subtitle="Programs" />

        <div className="grid md:grid-cols-3 gap-8">
          {courses.map((course: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ y: -8 }}
              className={`card-bento group bg-gradient-to-br ${course.gradient} border ${course.border}`}
            >
              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${course.color} opacity-5 blur-3xl -mr-20 -mt-20`} />

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {course.icon}
              </div>

              <h3 className="text-2xl font-extrabold text-navy-900 mb-1">{course.title}</h3>
              <p className="text-sm font-medium text-brand-600 mb-4">{course.grades}</p>

              <p className="text-sm text-navy-600 leading-relaxed mb-4">{course.description}</p>

              <div className="border-t border-navy-100 pt-4 mb-4">
                <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {course.subjects.map((sub: string, j: number) => (
                    <span key={j} className={`px-2 py-0.5 rounded-md text-xs font-medium ${i === 0 ? 'bg-brand-50 text-brand-700' : i === 1 ? 'bg-accent-50 text-accent-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="bg-navy-50 rounded-lg p-2.5">
                  <span className="font-semibold text-navy-700 block">Eligibility</span>
                  <span className="text-navy-500">{course.eligibility}</span>
                </div>
                <div className="bg-navy-50 rounded-lg p-2.5">
                  <span className="font-semibold text-navy-700 block">Batch Timings</span>
                  <span className="text-navy-500">{course.batchTimings[0]}<br />{course.batchTimings[1]}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {course.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-navy-600">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${i === 0 ? 'text-brand-500' : i === 1 ? 'text-accent-500' : 'text-emerald-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#enquiry"
                onClick={(e) => { e.preventDefault(); document.querySelector('#enquiry')?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`inline-flex items-center gap-2 text-sm font-bold py-3 px-6 rounded-xl bg-gradient-to-r ${course.color} text-white shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
              >
                Enquire Now
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Faculty Section ───
function FacultyCard({ faculty, index }: { faculty: typeof FACULTY[0]; index: number }) {
  const initials = faculty.name.split(' ').map(n => n[0]).join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="card-glass text-center group"
    >
      {/* Avatar */}
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xl font-bold mb-4 group-hover:scale-110 transition-transform duration-300 shadow-glow-blue">
        {initials}
      </div>

      <h3 className="font-bold text-navy-900 text-lg">{faculty.name}</h3>
      <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold mt-2 mb-1">
        {faculty.subject}
      </span>
      <p className="text-xs text-brand-500/70 font-medium mb-2">{faculty.specialization}</p>
      <div className="space-y-1 text-sm text-navy-500">
        <p>{faculty.qualification}</p>
        <p className="flex items-center justify-center gap-1 text-accent-600 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {faculty.experience}
        </p>
      </div>
    </motion.div>
  );
}

function FacultySection() {
  const { data } = useSiteData();
  const faculty = data.faculty && data.faculty.length > 0 ? data.faculty : FACULTY;
  return (
    <section id="faculty" className="py-24 relative overflow-hidden aurora-bg">
      <div className="absolute inset-0 bg-[url('/images/academy/hero-academy.svg')] bg-cover bg-center opacity-5" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Our Expert Faculty" subtitle="Mentors" light />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculty.map((f: any, i: number) => (
            <FacultyCard key={i} faculty={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Results Section ───
function ResultsSection() {
  const { data } = useSiteData();
  const [filter, setFilter] = useState('All');
  const [visible, setVisible] = useState(6);
  const studentResults = data['student-results'] && data['student-results'].length > 0 ? data['student-results'] : STUDENT_RESULTS;

  const filtered = filter === 'All' ? studentResults : studentResults.filter((r: any) => r.category === filter);
  const shown = filtered.slice(0, visible);

  const resultFilters = ['All', 'CBSE', 'NEET', 'JEE'];

  return (
    <section id="results" className="py-24 relative overflow-hidden aurora-bg-gold">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Our Results Speak" subtitle="Achievements" light />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {RESULTS.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="stat-card-glass"
            >
              <AnimatedCounter {...r} />
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {resultFilters.map((f: string) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setVisible(6); }}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === f
                  ? 'bg-white text-accent-700 shadow-lg'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              }`}
            >
              {f === 'All' ? 'All Results' : f}
            </button>
          ))}
        </motion.div>

        {/* Student Result Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {shown.map((student: any, i: number) => {
            const initials = student.name.split(' ').map((n: string) => n[0]).join('');
            const colorMap: Record<string, string> = { CBSE: 'from-brand-600 to-brand-800', JEE: 'from-accent-600 to-accent-800', NEET: 'from-emerald-500 to-emerald-700' };
            const badgeMap: Record<string, string> = { CBSE: 'bg-brand-500/20 text-brand-200 border-brand-400/30', JEE: 'bg-accent-500/20 text-accent-200 border-accent-400/30', NEET: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' };
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorMap[student.category] || 'from-brand-600 to-brand-800'} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-base truncate">{student.name}</h4>
                    <p className="text-xs text-accent-200/70 truncate">{student.school}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeMap[student.category]}`}>
                    {student.category}
                  </span>
                  <span className="text-xs text-accent-200/60">{student.year}</span>
                </div>

                <div className="text-center py-3">
                  <div className="text-3xl font-extrabold text-white">{student.percentage}%</div>
                </div>

                <p className="text-xs text-center text-accent-200/80 font-medium">{student.achievement}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Show More */}
        {visible < filtered.length && (
          <motion.div className="text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <button
              onClick={() => setVisible(prev => Math.min(prev + 6, filtered.length))}
              className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 transition-all"
            >
              View More Results
            </button>
          </motion.div>
        )}

        {/* Extra stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl font-extrabold text-white">100+</div>
            <div className="text-sm text-accent-200/80 font-medium mt-1">Students Above 90%</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl font-extrabold text-white">5</div>
            <div className="text-sm text-accent-200/80 font-medium mt-1">State Rank Holders</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 text-center">
            <div className="text-3xl font-extrabold text-white">500+</div>
            <div className="text-sm text-accent-200/80 font-medium mt-1">Scholarships Awarded</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials ───
function TestimonialsSection() {
  const { data } = useSiteData();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testimonialsData = data.testimonials && data.testimonials.length > 0 ? data.testimonials : TESTIMONIALS_DATA;

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonialsData.length);
  }, [testimonialsData]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length);
  }, []);

  // Auto-play testimonial carousel
  useEffect(() => {
    autoPlayRef.current = setInterval(next, 5000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [next]);

  // Pause auto-play on hover
  const pauseAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };
  const resumeAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(next, 5000);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-white">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-accent-500/10 to-brand-500/5 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-brand-500/10 to-purple-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2.5s' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="What People Say" subtitle="Testimonials" />

        <div className="relative max-w-4xl mx-auto">
          {/* Carousel */}
          <div className="relative overflow-hidden min-h-[280px]" onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="card-glass p-8 md:p-12"
              >
                {/* Quote icon */}
                <Quote className="w-12 h-12 text-brand-200 mb-4" />

                <p className="text-base md:text-lg text-navy-700 leading-relaxed mb-6 italic">
                  &ldquo;{testimonialsData[current].text}&rdquo;
                </p>

                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonialsData[current].rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-accent-400 text-accent-400" />
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                    {testimonialsData[current].name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-navy-900">{testimonialsData[current].name}</div>
                    <div className="text-sm text-navy-500">{testimonialsData[current].role}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-accent-100 text-accent-700 text-xs font-medium">
                      {testimonialsData[current].childClass}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={prev} className="p-3 rounded-full bg-white border border-navy-200 text-navy-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-soft" aria-label="Previous testimonial">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2" role="tablist" aria-label="Testimonial navigation">
              {testimonialsData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-brand-600 scale-125' : 'bg-navy-300 hover:bg-navy-400'
                  }`}
                />
              ))}
            </div>

            <button onClick={next} className="p-3 rounded-full bg-white border border-navy-200 text-navy-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-soft" aria-label="Next testimonial">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Section ───
function GallerySection() {
  const { data } = useSiteData();
  const [filter, setFilter] = useState('All');
  const [lightboxIndex, setLightbox] = useState<number | null>(null);
  const galleryImages = data.gallery && data.gallery.length > 0 ? data.gallery : GALLERY_IMAGES;

  const filtered = filter === 'All' ? galleryImages : galleryImages.filter((img: any) => img.category === filter);

  return (
    <section id="gallery" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-accent-50/20 to-white">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-brand-500/10 to-accent-500/5 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gradient-to-br from-accent-500/10 to-purple-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2s' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Our Gallery" subtitle="Moments" />

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                filter === cat
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white text-navy-600 hover:bg-brand-50 hover:text-brand-700 border border-navy-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((img: any, i: number) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => setLightbox(i)}
              className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 text-left"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={400}
                height={300}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white font-semibold text-sm">{img.label}</p>
                <span className="text-white/70 text-xs">{img.category}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full mx-4"
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                Close (Esc)
              </button>
              <Image
                src={filtered[lightboxIndex].src}
                alt={filtered[lightboxIndex].alt}
                width={1200}
                height={800}
                sizes="(max-width: 768px) 90vw, 80vw"
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-white font-semibold">{filtered[lightboxIndex].label}</p>
                  <span className="text-accent-400 text-xs font-medium">{filtered[lightboxIndex].category}</span>
                </div>

                {/* Nav */}
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={() => setLightbox((lightboxIndex - 1 + filtered.length) % filtered.length)}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLightbox((lightboxIndex + 1) % filtered.length)}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Enquiry Form ───
function EnquirySection() {
  const [form, setForm] = useState({ studentName: '', parentName: '', phone: '', email: '', studentClass: '', course: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.studentName || !form.parentName || !form.phone || !form.email || !form.studentClass) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone (10+ digits)
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number with at least 10 digits');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${API_URL}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <section id="enquiry" className="py-24 relative overflow-hidden aurora-bg">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-accent-500/10 blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Admission Enquiry" subtitle="Get Started" light />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl"
        >
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Enquiry Submitted!</h3>
              <p className="text-brand-200/70 max-w-md mx-auto">
                Thank you for your interest. Our admissions team will contact you shortly.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ studentName: '', parentName: '', phone: '', email: '', studentClass: '', course: '', message: '' }); }}
                className="mt-8 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
              >
                Submit Another Enquiry
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-200">Student Name *</label>
                  <input
                    type="text"
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    placeholder="Enter student name"
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-brand-300/50 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-200">Parent Name *</label>
                  <input
                    type="text"
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    placeholder="Enter parent name"
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-brand-300/50 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-200">Class *</label>
                  <select
                    value={form.studentClass}
                    onChange={(e) => setForm({ ...form, studentClass: e.target.value })}
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white/80 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all appearance-none"
                    required
                  >
                    <option value="" className="bg-brand-800 text-white">Select class</option>
                    <option value="6" className="bg-brand-800 text-white">Class 6</option>
                    <option value="7" className="bg-brand-800 text-white">Class 7</option>
                    <option value="8" className="bg-brand-800 text-white">Class 8</option>
                    <option value="9" className="bg-brand-800 text-white">Class 9</option>
                    <option value="10" className="bg-brand-800 text-white">Class 10</option>
                    <option value="11" className="bg-brand-800 text-white">Class 11</option>
                    <option value="12" className="bg-brand-800 text-white">Class 12</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-200">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-brand-300/50 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-200">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-brand-300/50 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-200">Course Interested In</label>
                <select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white/80 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all appearance-none"
                >
                  <option value="" className="bg-brand-800 text-white">Select a course</option>
                  <option value="CBSE" className="bg-brand-800 text-white">CBSE Coaching</option>
                  <option value="JEE" className="bg-brand-800 text-white">JEE Coaching</option>
                  <option value="NEET" className="bg-brand-800 text-white">NEET Coaching</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-200">Message (Optional)</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Any specific requirements..."
                  rows={4}
                  className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder-brand-300/50 focus:border-brand-400/40 focus:ring-2 focus:ring-brand-400/15 focus:bg-white/15 focus:outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-600 to-accent-800 text-white font-bold text-base shadow-xl shadow-accent-500/20 hover:shadow-accent-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Enquiry
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Contact Section ───
function ContactSection() {
  const { data } = useSiteData();
  const contact = data.contact || {};
  return (
    <section id="contact" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-white">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-brand-500/10 to-accent-500/5 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-accent-500/10 to-purple-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2s' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Get In Touch" subtitle="Contact" />

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              {[
                { icon: <MapPin className="w-5 h-5" />, title: 'Address', content: contact.address || '123, Academic Block, Education City,\nMain Road, District - 123456' },
                { icon: <Phone className="w-5 h-5" />, title: 'Phone', content: contact.phone || '+91 98765 43210\n+91 98765 43211' },
                { icon: <Mail className="w-5 h-5" />, title: 'Email', content: contact.email || 'info@dwarakaacademy.com\nadmissions@dwarakaacademy.com' },
                { icon: <Clock className="w-5 h-5" />, title: 'Working Hours', content: contact.workingHours || 'Mon \u2013 Sat: 7:00 AM \u2013 7:00 PM\nSunday: 9:00 AM \u2013 1:00 PM' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-glow-blue group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 text-sm">{item.title}</h3>
                    <p className="text-sm text-navy-500 mt-0.5 whitespace-pre-line">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Google Maps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <div className="rounded-2xl overflow-hidden card-glass h-[300px] w-full">
              <iframe
                src={contact.googleMapsEmbed || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.5!2d77.5!3d13.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDAwJzAwLjAiTiA3N8KwMzAnMDAuMCJF!5e0!3m2!1sen!2sin!4v1'}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Dwaraka Academy Location"
              />
            </div>
          </motion.div>
        </div>

        {/* Social */}
        <div className="pt-6 border-t border-navy-200/50 mt-12">
          <p className="text-sm font-semibold text-navy-700 mb-4">Follow Us</p>
          <div className="flex gap-3">
            {[
              { icon: <Globe className="w-5 h-5" />, label: 'Facebook', href: 'https://facebook.com/dwarakaacademy' },
              { icon: <Hash className="w-5 h-5" />, label: 'Twitter', href: 'https://twitter.com/dwarakaacademy' },
              { icon: <Camera className="w-5 h-5" />, label: 'Instagram', href: 'https://instagram.com/dwarakaacademy' },
              { icon: <Video className="w-5 h-5" />, label: 'Youtube', href: 'https://youtube.com/@dwarakaacademy' },
            ].map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200/50 flex items-center justify-center text-brand-600 hover:from-brand-600 hover:to-brand-800 hover:text-white hover:border-brand-600 transition-all duration-200"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Download Center ───
function DownloadCenterSection() {
  const { data } = useSiteData();
  const downloads = data.downloads && data.downloads.length > 0 ? data.downloads : DOWNLOADS_DATA;
  return (
    <section id="downloads" className="py-24 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/20 to-white">
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-brand-500/10 to-accent-500/5 blur-3xl pointer-events-none animate-levitate" />
      <div className="absolute -bottom-40 -right-40 w-72 h-72 rounded-full bg-gradient-to-br from-accent-500/10 to-purple-500/5 blur-3xl pointer-events-none animate-levitate" style={{ animationDelay: '-2.5s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle title="Download Center" subtitle="Resources" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {downloads.map((item: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="card-glass group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 group-hover:shadow-glow-blue transition-all duration-300`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-navy-900 text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-navy-500 leading-relaxed mb-5">{item.description}</p>
              <button
                onClick={() => {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                  window.open(`${API_URL}/downloads/${item.title.toLowerCase().replace(/\s+/g, '-')}.pdf`, '_blank');
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Footer (imported from @/components/Footer) ───
// Previously inline — now extracted to frontend/src/components/Footer.tsx

// ─── Floating Buttons ───
function FloatingButtons() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* WhatsApp */}
      <motion.a
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
        href="https://wa.me/919876543210"
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-xl shadow-green-500/30 hover:shadow-green-500/40 hover:-translate-y-1 transition-all duration-200"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.a>

      {/* Call */}
      <motion.a
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.7 }}
        href="tel:+919876543210"
        className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:-translate-y-1 transition-all duration-200"
        title="Call Us"
      >
        <Phone className="w-5 h-5" />
      </motion.a>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-600 to-brand-800 text-white flex items-center justify-center shadow-xl shadow-brand-500/30 hover:shadow-brand-500/40 hover:-translate-y-1 transition-all duration-200"
            title="Back to Top"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ───
export default function HomePage() {
  return (
    <SiteDataProvider>
      <main className="overflow-hidden">
        <Navbar />
        <HeroSection />
        <AboutSection />
        <WhyChooseUsSection />
        <CoursesSection />
        <FacultySection />
        <ResultsSection />
        <TestimonialsSection />
        <GallerySection />
        <EnquirySection />
        <ContactSection />
        <DownloadCenterSection />
        <Footer />
        <FloatingButtons />
      </main>
    </SiteDataProvider>
  );
}
