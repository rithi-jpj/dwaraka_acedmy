'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles, ArrowRight, ExternalLink, CheckCircle,
  Users, GraduationCap, Award, Target
} from 'lucide-react';
import { useSiteData } from '@/app/SiteDataContext';

// ─── Animated Counter ───
function AnimatedCounter({ end, suffix = '', label, icon }: {
  end: number; suffix?: string; label: string; icon: React.ReactNode;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    const duration = 2000;
    const raf = requestAnimationFrame(function animate(time) {
      if (!startTime) startTime = time;
      const elapsed = (time - startTime) / 1000;
      const progress = Math.min(elapsed / (duration / 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(raf);
  }, [isInView, end]);

  return (
    <div ref={ref} className="text-center p-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-400/20 flex items-center justify-center text-brand-400">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-extrabold text-white mb-1 font-mono">
        {count}{suffix}
      </div>
      <div className="text-sm text-brand-200/70 font-medium">{label}</div>
    </div>
  );
}

export default function HeroSection() {
  const { data } = useSiteData();
  const hero = data.hero || {};
  const heroSubtitle = hero.subtitle || 'Excellence in Education Since 2020';
  const heroHeadline = hero.headline || 'Admissions Open';
  const heroTags = hero.tags || ['CBSE', 'JEE', 'NEET'];
  const heroDescription = hero.description || 'Empowering students with quality education through expert faculty, personalized attention, and proven results.';
  const heroHighlights = hero.highlights || ['Quality Education', 'Experienced Faculty', 'Excellent Results', 'Individual Attention'];
  const heroStats = (hero.stats || [
    { label: 'Students Taught', end: 2000, suffix: '+', icon: <Users className="w-5 h-5" /> },
    { label: 'Expert Faculty', end: 25, suffix: '+', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'Years of Excellence', end: 14, suffix: '+', icon: <Award className="w-5 h-5" /> },
    { label: 'Success Rate', end: 98, suffix: '%', icon: <Target className="w-5 h-5" /> },
  ]).map((s: any) => ({ ...s, end: s.end ?? s.value }));

  // Mouse parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Aurora Multi Background */}
      <div className="absolute inset-0 aurora-bg-multi" />
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        role="img"
        aria-label="Dwaraka Academy campus background"
        style={{ backgroundImage: 'url(/images/academy/hero-academy.svg)' }}
      />

      {/* Glowing 3D blobs with mouse parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
          className="aurora-blob-1"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)` }}
          className="aurora-blob-2"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)` }}
          className="aurora-blob-3"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-white/90 text-xs font-semibold mb-8 glow-ring"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-400" />
          {heroSubtitle}
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold text-white tracking-tight leading-tight"
        >
          Dwaraka{' '}
          <span className="text-gradient bg-gradient-to-r from-accent-300 via-accent-400 to-accent-600 bg-clip-text text-transparent">
            Academy
          </span>
        </motion.h1>

        {/* Sub heading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-gold mt-4"
        >
          {heroHeadline}
        </motion.p>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          {heroTags.map((tag: string) => (
            <span key={tag} className="px-5 py-2 rounded-full glass text-white/90 text-sm font-medium">
              {tag} Coaching
            </span>
          ))}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          {heroDescription}
        </motion.p>

        {/* Highlight tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap justify-center gap-4 mt-6"
        >
          {heroHighlights.map((h: string) => (
            <span key={h} className="inline-flex items-center gap-1.5 text-sm text-white/70 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {h}
            </span>
          ))}
        </motion.div>

        {/* Glass CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <a
            href="#enquiry"
            onClick={(e) => { e.preventDefault(); document.querySelector('#enquiry')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn-glow px-8 py-4 text-base font-bold"
          >
            Enroll Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#enquiry"
            onClick={(e) => { e.preventDefault(); document.querySelector('#enquiry')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="group px-8 py-4 rounded-2xl glass text-white font-semibold text-base hover:bg-white/20 transition-all duration-200 inline-flex items-center gap-2"
          >
            Book Free Demo Class
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <Link href="/login" className="px-8 py-4 rounded-2xl glass text-white font-semibold text-base hover:bg-white/20 transition-all duration-200 inline-flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Student Login
          </Link>
        </motion.div>

        {/* Animated Counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {heroStats.map((stat: { label: string; end: number; suffix: string; icon: React.ReactNode }, i: number) => (
            <div key={i} className="stat-card-glow bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-5">
              <AnimatedCounter {...stat} />
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 mx-auto flex items-start justify-center pt-2"
          >
            <motion.div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
