'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, type Transition } from 'framer-motion';
import Link from 'next/link';

// ── Constants ──────────────────────────────────────────────────────────────────
const FADE_MS       = 500;
const FADE_OUT_LEAD = 0.55;

const SERIF = "'Instrument Serif', serif";
const SANS  = "'Barlow', sans-serif";

const HERO_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4';
const CAP_VIDEO  = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4';

// ── FadingVideo ────────────────────────────────────────────────────────────────
function FadingVideo({ src, className, style }: {
  src: string; className?: string; style?: React.CSSProperties;
}) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const rafRef       = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  const fadeTo = useCallback((video: HTMLVideoElement, target: number) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const t0    = performance.now();
    const start = parseFloat(video.style.opacity) || 0;
    const tick  = (now: number) => {
      const p = Math.min((now - t0) / FADE_MS, 1);
      video.style.opacity = String(start + (target - start) * p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.style.opacity = '0';

    const onLoaded = () => { v.style.opacity = '0'; v.play().catch(() => {}); fadeTo(v, 1); };
    const onTime   = () => {
      if (!fadingOutRef.current && v.duration > 0) {
        const rem = v.duration - v.currentTime;
        if (rem <= FADE_OUT_LEAD && rem > 0) { fadingOutRef.current = true; fadeTo(v, 0); }
      }
    };
    const onEnded  = () => {
      v.style.opacity = '0';
      setTimeout(() => {
        v.currentTime        = 0;
        fadingOutRef.current = false;
        v.play().catch(() => {});
        fadeTo(v, 1);
      }, 100);
    };

    v.addEventListener('loadeddata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended',      onEnded);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      v.removeEventListener('loadeddata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended',      onEnded);
    };
  }, [src, fadeTo]);

  return (
    <video ref={videoRef} src={src} autoPlay muted playsInline preload="auto"
      className={className} style={{ ...style, opacity: 0 }} />
  );
}

// ── BlurText ───────────────────────────────────────────────────────────────────
function BlurText({ text, className }: { text: string; className?: string }) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <p ref={ref} className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em' }}>
      {text.split(' ').map((word, i) => (
        <motion.span key={`w${i}`}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={inView ? {
            filter:  ['blur(10px)', 'blur(5px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y:       [50, -5, 0],
          } : {}}
          transition={{ duration: 0.7, delay: (i * 100) / 1000, ease: 'easeOut', times: [0, 0.5, 1] }}
          style={{ display: 'inline-block', marginRight: '0.28em', fontFamily: SERIF, fontStyle: 'italic' }}>
          {word}
        </motion.span>
      ))}
    </p>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function ArrowUpRight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" /><path d="M7 7h10v10" />
    </svg>
  );
}

function ClockSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GlobeSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-16">
      <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
        <span style={{ fontFamily: SERIF, fontStyle: 'italic' }} className="text-white text-xl leading-none">a</span>
      </div>

      <div className="hidden md:flex items-center liquid-glass rounded-full px-1.5 py-1.5 gap-0.5">
        {['Home', 'Voyages', 'Worlds', 'Innovation', 'Plan Launch'].map(l => (
          <a key={l} href="#" style={{ fontFamily: SANS }}
            className="px-3 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors whitespace-nowrap">
            {l}
          </a>
        ))}
        <Link href="/login" style={{ fontFamily: SANS }}
          className="flex items-center gap-1.5 bg-white text-black px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ml-1">
          Claim a Spot <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="w-12 h-12 flex-shrink-0" aria-hidden="true" />
    </nav>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────────
const fadeIn = (delay: number) => ({
  initial:    { filter: 'blur(10px)', opacity: 0, y: 20 } as const,
  animate:    { filter: 'blur(0px)',  opacity: 1, y: 0  } as const,
  transition: { duration: 0.6, delay, ease: 'easeOut' } as Transition,
});

function HeroSection() {
  return (
    <section className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      <FadingVideo src={HERO_VIDEO}
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
        style={{ width: '120%', height: '120%' }} />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          {/* Badge */}
          <motion.div {...fadeIn(0.4)}
            className="liquid-glass rounded-full flex items-center gap-2 px-1.5 py-1.5 mb-8">
            <span style={{ fontFamily: SANS }}
              className="bg-white text-black px-3 py-1 text-xs font-semibold rounded-full">New</span>
            <span style={{ fontFamily: SANS }} className="text-sm text-white/90 pr-3">
              Maiden Crewed Voyage to Mars Arrives 2026
            </span>
          </motion.div>

          {/* Headline */}
          <BlurText
            text="Venture Past Our Sky Across the Universe"
            className="text-6xl md:text-7xl lg:text-[5.5rem] text-white leading-[0.8] max-w-2xl tracking-[-4px]"
          />

          {/* Sub-heading */}
          <motion.p {...fadeIn(0.8)} style={{ fontFamily: SANS }}
            className="mt-4 text-sm md:text-base text-white max-w-2xl font-light leading-tight">
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough
            engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeIn(1.1)} className="flex items-center gap-6 mt-6">
            <Link href="/login" style={{ fontFamily: SANS }}
              className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white flex items-center gap-2">
              Start Your Voyage <ArrowUpRight size={20} />
            </Link>
            <button style={{ fontFamily: SANS }}
              className="flex items-center gap-2 text-white text-sm font-medium cursor-pointer">
              View Liftoff
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeIn(1.3)} className="flex items-stretch gap-4 mt-8">
            {[
              { label: '34.5 Min', sub: 'Average Videos Watch Time', icon: <ClockSVG /> },
              { label: '2.8B+',   sub: 'Users Across the Globe',    icon: <GlobeSVG /> },
            ].map(({ label, sub, icon }) => (
              <div key={label} className="liquid-glass p-5 w-[220px] rounded-[1.25rem] flex flex-col gap-3">
                {icon}
                <div>
                  <div style={{ fontFamily: SERIF, fontStyle: 'italic' }}
                    className="text-4xl text-white tracking-[-1px] leading-none">{label}</div>
                  <div style={{ fontFamily: SANS }} className="text-xs text-white font-light mt-2">{sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Partners */}
        <motion.div {...fadeIn(1.4)} className="flex flex-col items-center gap-4 pb-8">
          <span style={{ fontFamily: SANS }}
            className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white">
            Collaborating with top aerospace pioneers globally
          </span>
          <div className="flex items-center gap-12 md:gap-16 flex-wrap justify-center px-4">
            {['Aeon', 'Vela', 'Apex', 'Orbit', 'Zeno'].map(n => (
              <span key={n} style={{ fontFamily: SERIF, fontStyle: 'italic' }}
                className="text-white text-2xl md:text-3xl tracking-tight">{n}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Capabilities Section ───────────────────────────────────────────────────────
const CARDS = [
  {
    title: 'AI Scenery',
    tags:  ['Natural Context', 'Photo Realism', 'Infinite Settings', 'Eco-Vibe'],
    body:  'AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.',
    icon:  'M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z',
  },
  {
    title: 'Batch Production',
    tags:  ['Scale Fast', 'Visual Consistency', 'Time Saver', 'Ready to Post'],
    body:  'Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.',
    icon:  'M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z',
  },
  {
    title: 'Smart Lighting',
    tags:  ['Ray Tracing', 'Physical Shadows', 'Studio Quality', 'Sunlight Sync'],
    body:  'Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.',
    icon:  'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z',
  },
] as const;

function CapabilitiesSection() {
  return (
    <section className="relative w-full min-h-screen bg-black overflow-hidden">
      <FadingVideo src={CAP_VIDEO} className="absolute inset-0 w-full h-full object-cover z-0" />

      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
        <div className="mb-auto">
          <p style={{ fontFamily: SANS }} className="text-sm text-white/80 mb-6 tracking-wide">// Capabilities</p>
          <h2 style={{ fontFamily: SERIF, fontStyle: 'italic' }}
            className="text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
            Production<br />evolved
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {CARDS.map((card, i) => (
            <div key={i} className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                    <path d={card.icon} />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {card.tags.map(t => (
                    <span key={t} style={{ fontFamily: SANS }}
                      className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 whitespace-nowrap">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1" />

              <div className="mt-6">
                <h3 style={{ fontFamily: SERIF, fontStyle: 'italic' }}
                  className="text-white text-3xl md:text-4xl tracking-[-1px] leading-none">{card.title}</h3>
                <p style={{ fontFamily: SANS }}
                  className="mt-3 text-sm text-white/90 font-light leading-snug max-w-[32ch]">{card.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Root export ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: '#000' }} className="w-full">
      <HeroSection />
      <CapabilitiesSection />
    </div>
  );
}
