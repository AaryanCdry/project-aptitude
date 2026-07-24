'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Typography styles ──────────────────────────────────────────────────────────
const SERIF = "'Instrument Serif', serif";
const SANS  = "var(--font-dm-sans), sans-serif";
const HEADING = "var(--font-bricolage), sans-serif";

// ── Icons ──────────────────────────────────────────────────────────────────────
function ArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ArrowUpRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function ShieldCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CpuIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

function ZapIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function AwardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function TargetIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// ── Sample Adaptive Questions for Interactive Hero Simulator ────────────────────
const SAMPLE_QUESTIONS = [
  {
    category: 'Logical Reasoning (IRT Level 3.4)',
    question: 'If all Technologists are Innovators and some Innovators are Strategists, which conclusion must hold true?',
    options: [
      { text: 'A) All Strategists are Technologists', correct: false },
      { text: 'B) Some Technologists may be Strategists', correct: true },
      { text: 'C) No Strategist is a Technologist', correct: false },
      { text: 'D) All Innovators are Technologists', correct: false }
    ],
    explanation: 'Since Technologists are a subset of Innovators, and some Innovators overlap with Strategists, an overlap between Technologists and Strategists is possible.'
  },
  {
    category: 'Situational Judgement (SJT)',
    question: 'During a production deployment, a critical microservice latency spikes by 400%. What is your primary immediate action?',
    options: [
      { text: 'A) Roll back to the previous stable release version', correct: true },
      { text: 'B) Refactor the database query live on production', correct: false },
      { text: 'C) Wait for automated telemetry to self-heal', correct: false },
      { text: 'D) Email all stakeholders before inspecting logs', correct: false }
    ],
    explanation: 'Rolling back mitigates user impact immediately while root-cause analysis is conducted in parallel.'
  },
  {
    category: 'Quantitative Aptitude (IRT Level 4.2)',
    question: 'A neural network pipeline processes 120 tokens/sec. If optimization increases throughput by 35%, how long to process 972 tokens?',
    options: [
      { text: 'A) 8.0 seconds', correct: false },
      { text: 'B) 6.0 seconds', correct: true },
      { text: 'C) 7.2 seconds', correct: false },
      { text: 'D) 5.5 seconds', correct: false }
    ],
    explanation: 'New rate = 120 * 1.35 = 162 tokens/sec. Time = 972 / 162 = 6.0 seconds.'
  }
];

// ── Navbar Component ───────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-[#090d16]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl' : 'py-5 bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <div className="w-full h-full bg-[#0b0f19] rounded-[11px] flex items-center justify-center">
              <span style={{ fontFamily: HEADING }} className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                A
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <span style={{ fontFamily: HEADING }} className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              AptiLead
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md">
                AI IRT
              </span>
            </span>
          </div>
        </Link>

        {/* Center Nav Items */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-inner">
          {[
            { label: 'Capabilities', href: '#features' },
            { label: 'Adaptive IRT', href: '#adaptive' },
            { label: 'Portals', href: '#portals' },
            { label: 'Verify Credential', href: '#verify' },
            { label: 'FAQ', href: '#faq' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              style={{ fontFamily: SANS }}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            style={{ fontFamily: SANS }}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verify Certificate
          </Link>
          <Link
            href="/login"
            style={{ fontFamily: SANS }}
            className="relative group overflow-hidden rounded-full p-[1px] font-medium text-xs shadow-lg shadow-indigo-500/25"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full group-hover:opacity-90 transition-opacity" />
            <span className="relative flex items-center gap-2 bg-[#090d16] hover:bg-transparent text-white px-5 py-2.5 rounded-full transition-all duration-300">
              Sign In / Assessment
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────────
function HeroSection() {
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(740);

  const currentQ = SAMPLE_QUESTIONS[activeQIndex];

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelectedOption(idx);
    setSubmitted(true);

    if (currentQ.options[idx].correct) {
      setScore(prev => prev + 35);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setActiveQIndex(prev => (prev + 1) % SAMPLE_QUESTIONS.length);
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-[#070a12]">
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md mb-6 shadow-sm"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span style={{ fontFamily: SANS }} className="text-xs font-medium text-slate-300">
                AI Proctoring & Adaptive IRT Engine Active
              </span>
              <span className="text-indigo-400 font-semibold text-xs pl-1">v2.4</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: HEADING }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6"
            >
              Evaluate True Potential with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Adaptive AI Aptitude
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontFamily: SANS }}
              className="text-lg sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed mb-8"
            >
              Next-generation assessment platform powered by Item Response Theory (IRT), Situational Judgement Tests (SJT), real-time AI anti-cheat proctoring, and instant career-to-job matching.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                style={{ fontFamily: SANS }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm px-7 py-3.5 rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Start Candidate Test
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#portals"
                style={{ fontFamily: SANS }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white font-medium text-sm px-6 py-3.5 rounded-2xl border border-white/10 backdrop-blur-md transition-all duration-200"
              >
                Explore Enterprise Portal
              </a>
            </motion.div>

            {/* Key Trust Signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 pt-10 mt-10 border-t border-white/10 w-full"
            >
              {[
                { val: '99.4%', label: 'Proctor Integrity' },
                { val: '10k+', label: 'Assessments Taken' },
                { val: '< 1.8s', label: 'Adaptive Calibration' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span style={{ fontFamily: HEADING }} className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {stat.val}
                  </span>
                  <span style={{ fontFamily: SANS }} className="text-xs text-slate-400 font-medium mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Right: Interactive Live Assessment Simulator */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative rounded-3xl p-[1px] bg-gradient-to-b from-indigo-500/40 via-purple-500/20 to-cyan-500/30 shadow-2xl shadow-indigo-900/40"
            >
              <div className="bg-[#0c101c]/90 backdrop-blur-xl rounded-[23px] p-6 sm:p-7 flex flex-col gap-5 border border-white/10">
                {/* Simulator Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      <CpuIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div style={{ fontFamily: HEADING }} className="text-sm font-semibold text-white">
                        Live IRT Simulator
                      </div>
                      <div style={{ fontFamily: SANS }} className="text-xs text-indigo-300/80">
                        {currentQ.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                      Score: {score}
                    </span>
                  </div>
                </div>

                {/* Question Body */}
                <div className="min-h-[90px] flex flex-col justify-center">
                  <p style={{ fontFamily: SANS }} className="text-sm sm:text-base text-slate-100 font-medium leading-snug">
                    {currentQ.question}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    let btnStyle = "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20";
                    
                    if (submitted) {
                      if (opt.correct) {
                        btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
                      } else if (isSelected && !opt.correct) {
                        btnStyle = "bg-rose-500/20 border-rose-500/50 text-rose-200";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={submitted}
                        style={{ fontFamily: SANS }}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all duration-200 flex items-center justify-between group ${btnStyle}`}
                      >
                        <span>{opt.text}</span>
                        {submitted && opt.correct && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback / Next Controls */}
                <AnimatePresence mode="wait">
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-white/10 flex flex-col gap-3"
                    >
                      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200">
                        <span className="font-semibold text-indigo-300">Adaptive AI Note: </span>
                        {currentQ.explanation}
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        style={{ fontFamily: SANS }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        Try Next Question Calibration
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Capabilities Bento Grid Section ──────────────────────────────────────────
const CAPABILITIES = [
  {
    title: 'Adaptive IRT Question Engine',
    category: 'Dynamic Item Calibration',
    desc: 'Questions dynamically adjust in real-time based on candidate performance. Leverages 3-parameter logistic Item Response Theory for precision measurement.',
    badge: 'Core Engine',
    icon: CpuIcon,
    colSpan: 'lg:col-span-7',
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    accentColor: 'text-indigo-400'
  },
  {
    title: 'AI Anti-Cheat Shield',
    category: 'Proctoring & Security',
    desc: 'Live tab switch tracking, gaze direction anomalies, facial presence verification, and integrity score generation.',
    badge: 'Real-time Security',
    icon: ShieldCheck,
    colSpan: 'lg:col-span-5',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    accentColor: 'text-cyan-400'
  },
  {
    title: 'Situational Judgement (SJT)',
    category: 'Workplace Simulations',
    desc: 'Branching realistic scenario questions evaluating critical decision making, conflict resolution, leadership, and emotional intelligence.',
    badge: 'Soft Skill IQ',
    icon: TargetIcon,
    colSpan: 'lg:col-span-5',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    accentColor: 'text-emerald-400'
  },
  {
    title: 'Verifiable Credentials & PDF Reports',
    category: 'Instant Proof of Skill',
    desc: 'Every completed test generates an anti-tamper PDF report with unique verification hashes and public QR validation.',
    badge: 'Public Lookup',
    icon: AwardIcon,
    colSpan: 'lg:col-span-7',
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    accentColor: 'text-purple-400'
  }
];

function CapabilitiesSection() {
  return (
    <section id="features" className="py-24 bg-[#090d17] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span style={{ fontFamily: SANS }} className="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full">
            Engineered For Excellence
          </span>
          <h2 style={{ fontFamily: HEADING }} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4 mb-4">
            Comprehensive Aptitude & Assessment Intelligence
          </h2>
          <p style={{ fontFamily: SANS }} className="text-slate-400 text-base sm:text-lg">
            Built for modern candidate evaluation, academic institutions, and enterprise hiring pipelines.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`${cap.colSpan} relative rounded-3xl p-[1px] bg-gradient-to-b from-white/15 to-white/5 overflow-hidden group`}
              >
                <div className={`h-full bg-[#0d1222]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br ${cap.gradient}`}>
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`p-3 rounded-2xl bg-white/[0.06] border border-white/10 ${cap.accentColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span style={{ fontFamily: SANS }} className="text-xs font-medium text-slate-300 bg-white/[0.06] px-3 py-1 rounded-full border border-white/10">
                        {cap.badge}
                      </span>
                    </div>

                    <span style={{ fontFamily: SANS }} className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                      {cap.category}
                    </span>
                    <h3 style={{ fontFamily: HEADING }} className="text-2xl font-bold text-white mt-1 mb-3">
                      {cap.title}
                    </h3>
                    <p style={{ fontFamily: SANS }} className="text-slate-300 text-sm font-light leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    <span>Learn technical specifications</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ── Multi-Role Portal Showcase Section ─────────────────────────────────────────
function PortalsSection() {
  const [activeTab, setActiveTab] = useState<'student' | 'mentor' | 'company'>('student');

  const ROLE_DATA = {
    student: {
      title: 'Candidates & Students',
      subtitle: 'Take adaptive tests, track radar skill growth, and receive automated job match offers.',
      bullets: [
        'Personalized radar skill matrix (Quant, Verbal, Logic, SJT)',
        'Adaptive practice mode with instant explanations',
        'Downloadable certified performance transcripts with QR verification',
        'Direct application matching with top hiring partner companies'
      ],
      cta: 'Launch Candidate Portal',
      href: '/login',
      metric: '94% Higher Placement Match'
    },
    mentor: {
      title: 'Mentors & Educators',
      subtitle: 'Assign custom scheduled assessments, monitor live proctoring, and review cohort analytics.',
      bullets: [
        'Batch scheduling with automated email access tokens',
        'Cohort skill diagnostic heatmaps & weakness analysis',
        'Proctor violation flag review timeline',
        'Custom passing threshold & benchmarking rules'
      ],
      cta: 'Access Mentor Dashboard',
      href: '/login',
      metric: '85% Time Saved on Grading'
    },
    company: {
      title: 'Companies & Recruiters',
      subtitle: 'Streamline technical pre-screening, filter top 5% candidates, and export Excel benchmark data.',
      bullets: [
        'Custom branded candidate test portal',
        'Proctored candidate leaderboard with automated cut-offs',
        'Full PDF report downloads and candidate comparisons',
        'Instant invite links with single-use expiration tokens'
      ],
      cta: 'Explore Enterprise Suite',
      href: '/login',
      metric: '4x Faster Screening Pipeline'
    }
  };

  const currentRole = ROLE_DATA[activeTab];

  return (
    <section id="portals" className="py-24 bg-[#070a12] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span style={{ fontFamily: SANS }} className="text-xs font-semibold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full">
            Tailored Experiences
          </span>
          <h2 style={{ fontFamily: HEADING }} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4 mb-4">
            Unified Ecosystem for Every Stakeholder
          </h2>
        </div>

        {/* Role Tabs */}
        <div className="flex justify-center mb-12">
          <div className="p-1.5 bg-white/[0.05] border border-white/10 backdrop-blur-md rounded-2xl inline-flex gap-2">
            {[
              { id: 'student', label: 'For Candidates' },
              { id: 'mentor', label: 'For Educators' },
              { id: 'company', label: 'For Enterprise' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ fontFamily: SANS }}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-indigo-500/30 to-purple-500/10 overflow-hidden">
          <div className="bg-[#0b0f19] rounded-[23px] p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 flex flex-col items-start">
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 mb-4">
                {currentRole.metric}
              </span>
              <h3 style={{ fontFamily: HEADING }} className="text-3xl font-bold text-white mb-3">
                {currentRole.title}
              </h3>
              <p style={{ fontFamily: SANS }} className="text-slate-300 text-base font-light mb-6">
                {currentRole.subtitle}
              </p>

              <div className="space-y-3 mb-8 w-full">
                {currentRole.bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <span style={{ fontFamily: SANS }} className="text-sm text-slate-200">
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={currentRole.href}
                style={{ fontFamily: SANS }}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
              >
                {currentRole.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mock Visual */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#111628] border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">AptiLead System Console</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Quantitative IRT Score</div>
                      <div className="text-lg font-bold text-white">820 / 900</div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                      Top 2% Globally
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Proctor Integrity Score</div>
                      <div className="text-lg font-bold text-white">100% Valid</div>
                    </div>
                    <div className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md">
                      0 Violations
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

// ── Verification Demo Section ──────────────────────────────────────────────────
function VerificationSection() {
  const [certId, setCertId] = useState('APT-2026-X9Y2');
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(true);
  };

  return (
    <section id="verify" className="py-20 bg-[#080c16] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6">
            <span style={{ fontFamily: SANS }} className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
              Trust & Transparency
            </span>
            <h2 style={{ fontFamily: HEADING }} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4 mb-4">
              Instant Public Credential Verification
            </h2>
            <p style={{ fontFamily: SANS }} className="text-slate-300 text-base leading-relaxed mb-6">
              Recruiters and institutions can immediately verify the authenticity of candidate test scores and certificates using our cryptographic verification service.
            </p>
            <div className="space-y-3">
              {[
                'Tamper-proof cryptographic score hashes',
                'Detailed skill break-down breakdown & proctor integrity log',
                'Downloadable official PDF transcript',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span style={{ fontFamily: SANS }} className="text-sm text-slate-200">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl p-[1px] bg-gradient-to-b from-emerald-500/30 via-teal-500/10 to-transparent">
              <div className="bg-[#0b0f19] rounded-[23px] p-6 sm:p-8 border border-white/10">
                <h3 style={{ fontFamily: HEADING }} className="text-xl font-bold text-white mb-2">
                  Test Certificate Lookup
                </h3>
                <p style={{ fontFamily: SANS }} className="text-xs text-slate-400 mb-6">
                  Enter a candidate certificate ID or try sample ID <code className="text-indigo-300 bg-white/5 px-1.5 py-0.5 rounded">APT-2026-X9Y2</code>
                </p>

                <form onSubmit={handleVerify} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => { setCertId(e.target.value); setVerified(false); }}
                    placeholder="Enter Certificate ID..."
                    style={{ fontFamily: SANS }}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    style={{ fontFamily: SANS }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Verify
                  </button>
                </form>

                {verified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Valid Credential Verified
                      </span>
                      <span className="font-mono text-emerald-300">PASS</span>
                    </div>
                    <div className="text-slate-300">
                      Candidate: <strong className="text-white">Alex Mercer</strong> | Aptitude Index: <strong className="text-white">885/900</strong>
                    </div>
                    <Link href="/verify" className="text-emerald-400 underline font-medium mt-1">
                      View Full Public Verification Page →
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── FAQ Section ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does Item Response Theory (IRT) work in AptiLead?',
    a: 'Unlike static tests, our IRT engine recalculates candidate ability level after every single answer. If you answer correctly, the next question increases in difficulty and score weight; if incorrect, it adjusts to calibrate your exact skill ceiling.'
  },
  {
    q: 'How does AI anti-cheat proctoring prevent unauthorized assistance?',
    a: 'AptiLead monitors tab visibility, focus changes, temporal response anomalies, and optional camera gaze analysis to compute an overall Proctor Integrity Score. Flags are highlighted clearly in the mentor/company timeline.'
  },
  {
    q: 'Can companies set custom cut-off thresholds for candidate screening?',
    a: 'Yes! Companies can define minimum overall scores, category-specific cutoffs (e.g. minimum 750 in Quantitative reasoning), and custom candidate invitation links.'
  },
  {
    q: 'Are certificates publicly verifiable?',
    a: 'Yes, every completed evaluation generates a unique cryptographic hash and QR code accessible at `/verify`.'
  }
];

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-[#070a12] relative border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <span style={{ fontFamily: SANS }} className="text-xs font-semibold uppercase tracking-widest text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full">
            Got Questions?
          </span>
          <h2 style={{ fontFamily: HEADING }} className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{ fontFamily: SANS }}
                  className="w-full p-6 text-left font-semibold text-white text-base sm:text-lg flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <span className="text-xl text-indigo-400 font-light">{isOpen ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-sm text-slate-300 font-light leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#05070d] border-t border-white/10 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Call to Action Banner */}
        <div className="relative rounded-3xl p-8 sm:p-12 mb-16 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-cyan-900/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 style={{ fontFamily: HEADING }} className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Ready to Assess Your True Aptitude?
            </h3>
            <p style={{ fontFamily: SANS }} className="text-slate-300 text-sm font-light">
              Join thousands of candidates, mentors, and employers using AptiLead today.
            </p>
          </div>
          <Link
            href="/login"
            style={{ fontFamily: SANS }}
            className="whitespace-nowrap bg-white text-black font-semibold text-xs px-6 py-3.5 rounded-full hover:bg-slate-200 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: HEADING }} className="text-base font-bold text-white">AptiLead</span>
            <span className="text-slate-500">• Adaptive Assessment Platform</span>
          </div>
          <div>
            © {new Date().getFullYear()} AptiLead Inc. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}

// ── Root Landing Page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="w-full bg-[#070a12] text-slate-100 min-h-screen">
      <Navbar />
      <HeroSection />
      <CapabilitiesSection />
      <PortalsSection />
      <VerificationSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
