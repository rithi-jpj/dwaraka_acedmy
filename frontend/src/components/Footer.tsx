'use client';
import Link from 'next/link';
import { GraduationCap, MapPin, Phone, Mail, ArrowRight, Sparkles } from 'lucide-react';

const QUICK_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About Us' },
  { href: '#courses', label: 'Courses' },
  { href: '#why-us', label: 'Why Choose Us' },
  { href: '#faculty', label: 'Faculty' },
  { href: '#results', label: 'Results' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
];

const COURSES_LINKS = [
  { href: '#courses', label: 'CBSE Coaching' },
  { href: '#courses', label: 'JEE Coaching' },
  { href: '#courses', label: 'NEET Coaching' },
];

const CONTACT_INFO = [
  { icon: <MapPin className="w-5 h-5" />, text: '123, Academic Block, Education City, Karnataka, India' },
  { icon: <Phone className="w-5 h-5" />, text: '+91 9876543210' },
  { icon: <Mail className="w-5 h-5" />, text: 'info@dwarakaacademy.com' },
];

export default function Footer() {
  return (
    <footer className="relative bg-navy-900 overflow-hidden">
      {/* Subtle aurora overlay */}
      <div className="absolute inset-0 aurora-bg-multi opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow-blue flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white">
                Dwaraka <span className="text-gradient">Academy</span>
              </span>
            </Link>
            <p className="text-sm text-navy-300 leading-relaxed mb-6">
              Premier educational institution dedicated to shaping the future of students through comprehensive coaching for CBSE, JEE, and NEET examinations.
            </p>
            {/* Call to action */}
            <Link
              href="#enquiry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-600 to-accent-800 text-white text-sm font-bold shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Enquire Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-navy-300 hover:text-accent-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Our Courses</h3>
            <ul className="space-y-3">
              {COURSES_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-navy-300 hover:text-accent-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">Contact Us</h3>
            <ul className="space-y-4">
              {CONTACT_INFO.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-navy-300">
                  <span className="text-accent-400 mt-0.5 flex-shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-navy-500">
            &copy; {new Date().getFullYear()} Dwaraka Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-navy-500">
            <a href="/privacy-policy" className="hover:text-accent-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-accent-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
