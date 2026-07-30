'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, Sparkles } from 'lucide-react';

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

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-nav shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              scrolled ? 'bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow-blue' : 'bg-white/20 backdrop-blur-sm'
            }`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-extrabold tracking-tight transition-colors duration-300 ${
              scrolled ? 'text-navy-900' : 'text-white'
            }`}>
              Dwaraka <span className={scrolled ? 'text-gradient' : 'text-accent-400'}>Academy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`px-4 py-2 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  scrolled
                    ? 'text-navy-600 hover:text-brand-700 hover:bg-brand-50 hover:shadow-soft'
                    : 'text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                }`}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="ml-3 btn-glow px-5 py-2.5 text-sm font-bold"
            >
              <Sparkles className="w-4 h-4" />
              Student Login
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2.5 rounded-2xl transition-all duration-200 ${
              scrolled ? 'text-navy-700 hover:bg-navy-100' : 'text-white hover:bg-white/10 backdrop-blur-sm'
            }`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass overflow-hidden shadow-glass-lg"
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="block px-4 py-3 text-sm font-medium text-navy-700 hover:text-brand-700 hover:bg-brand-50 rounded-2xl transition-all"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-accent-600 to-accent-800 rounded-2xl text-center mt-3 shadow-lg shadow-accent-500/25"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Student Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
