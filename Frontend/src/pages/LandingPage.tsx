import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, Globe, Shield, Video, MessageSquare, Bell,
  ArrowRight, Menu, X, Play, ChevronLeft, ChevronRight, Users,
  CheckCircle2, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    icon: Clock,
    title: 'Flexible Event Types',
    description: 'Create 15-minute chats, 60-minute deep dives, or custom durations. Each with its own booking link.',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    icon: Globe,
    title: 'Timezone Intelligence',
    description: 'Automatically detect and convert timezones. No more scheduling confusion across the globe.',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    icon: Shield,
    title: 'Prevent Double Booking',
    description: 'Real-time availability sync ensures no slot is booked twice. Your calendar stays organized.',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    icon: Video,
    title: 'Video Conferencing',
    description: 'Automatically generate Zoom, Google Meet, or Teams links for every scheduled meeting.',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
  },
  {
    icon: MessageSquare,
    title: 'Custom Questions',
    description: 'Ask invitees anything before they book. Collect project details, goals, or special requests.',
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Automated email reminders reduce no-shows. Get notified before every meeting.',
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Create Event Types',
    description: 'Set up different meeting types with custom durations, questions, and availability.',
  },
  {
    num: '02',
    title: 'Share Your Link',
    description: 'Send your unique booking link to clients, colleagues, or anyone who needs your time.',
  },
  {
    num: '03',
    title: 'Get Booked',
    description: 'They pick a time, fill in details, and it magically appears in your calendar.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'SC',
    name: 'Sarah Chen',
    role: 'Product Consultant',
    quote:
      '"ScheduleFlow transformed how I handle client calls. What used to take 10+ emails now happens in one click. My time is finally my own."',
  },
  {
    initials: 'MJ',
    name: 'Marcus Johnson',
    role: 'Leadership Coach',
    quote:
      '"The timezone handling is flawless. I work with clients across 15 countries and haven\'t had a single scheduling mishap since switching."',
  },
  {
    initials: 'ER',
    name: 'Emily Rodriguez',
    role: 'UX Designer',
    quote:
      '"Clean, fast, and incredibly intuitive. My clients always mention how professional the booking experience feels."',
  },
];

// Calendar mockup static data
const CAL_DAYS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, null, null, null, null],
];
const CAL_HIGHLIGHTED = [11, 19, 23];
const CAL_SELECTED = 16;
const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:30 AM', '2:00 PM', '3:00 PM', '4:30 PM'];
const TIME_SELECTED = '10:00 AM';

// ─── Reusable atoms ─────────────────────────────────────────────────────────

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function AvatarStack() {
  const avatars = [
    { initials: 'A', bg: '#4F46E5' },
    { initials: 'B', bg: '#7C3AED' },
    { initials: 'C', bg: '#2563EB' },
    { initials: 'D', bg: '#0891B2' },
    { initials: 'E', bg: '#059669' },
  ];
  return (
    <div className="flex -space-x-2">
      {avatars.map((a) => (
        <div
          key={a.initials}
          className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
          style={{ background: a.bg }}
        >
          {a.initials}
        </div>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold tracking-widest uppercase text-indigo-600 mb-3">
      {children}
    </p>
  );
}

// ─── Calendar Mockup ────────────────────────────────────────────────────────

function CalendarMockup() {
  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="relative w-full max-w-[480px] select-none">
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
        {/* Card header */}
        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 font-medium mb-0.5">Select a time slot</p>
          <p className="text-base font-bold text-gray-900">30 Minute Meeting</p>
        </div>

        <div className="px-6 py-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">June 2024</span>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="mb-4">
            {CAL_DAYS.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => (
                  <div key={di} className="flex justify-center py-0.5">
                    {day === null ? (
                      <div className="w-8 h-8" />
                    ) : day === CAL_SELECTED ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-600">
                        {day}
                      </div>
                    ) : CAL_HIGHLIGHTED.includes(day) ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600 bg-indigo-50">
                        {day}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
                        {day}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <p className="text-xs font-semibold text-gray-500 mb-2">Available slots for June 16</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map(t => (
              <button
                key={t}
                className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                  t === TIME_SELECTED
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating: Meeting booked */}
      <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 px-4 py-2.5 flex items-center gap-3 min-w-[180px]">
        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-teal-500" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">Meeting booked</p>
          <p className="text-xs font-bold text-gray-900">Tomorrow @ 10am</p>
        </div>
      </div>

      {/* Floating: Clock icon */}
      <div className="absolute top-14 -right-5 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(79,70,229,0.4)]">
        <Clock className="w-5 h-5 text-white" />
      </div>

      {/* Floating: This week */}
      <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-gray-100 px-4 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 font-medium">This week</p>
          <p className="text-xs font-bold text-gray-900">12 meetings scheduled</p>
        </div>
      </div>
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon, title, description, iconBg, iconColor,
}: {
  icon: LucideIcon; title: string; description: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: iconBg }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <h3 className="text-[15px] font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ num, title, description }: { num: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-extrabold mx-auto mb-6">
        {num}
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({
  initials, name, role, quote,
}: {
  initials: string; name: string; role: string; quote: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
      <Stars />
      <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-6">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goToApp = () => navigate('/event-types');

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <button onClick={goToApp} className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_0_2px_rgba(79,70,229,0.15)]">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">ScheduleFlow</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {['Features', 'How it works', 'Testimonials'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:block shrink-0">
            <button
              onClick={goToApp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-4">
            {['Features', 'How it works', 'Testimonials'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
                className="block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <button
              onClick={goToApp}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-16 pb-24 px-6">
        {/* Subtle bg gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(79,70,229,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-20 relative">
          {/* Left */}
          <div className="flex-1 max-w-xl">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600">Trusted by 50,000+ professionals</span>
            </div>

            {/* Headline */}
            <h1 className="font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6" style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4rem)' }}>
              Schedule meetings{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                without the back-and-forth
              </span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md">
              Stop playing email tag. Let others book time with you instantly. Set your availability once, share your link, and focus on what matters.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={goToApp}
                className="inline-flex items-center gap-2 px-7 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-[0_4px_16px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.45)] hover:-translate-y-0.5"
              >
                Start for free <ArrowRight className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2.5 px-7 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <Play className="w-4 h-4" />
                Watch demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <AvatarStack />
              <div>
                <div className="flex items-center gap-1.5">
                  <Stars />
                  <span className="text-sm font-bold text-gray-900">4.9/5</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">from 2,000+ reviews</p>
              </div>
            </div>
          </div>

          {/* Right — calendar mockup */}
          <div className="flex-1 flex justify-center lg:justify-end pb-6 pr-4 lg:pr-0">
            <CalendarMockup />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
              Everything you need for<br className="hidden sm:block" /> seamless scheduling
            </h2>
            <p className="text-base text-gray-500 max-w-md mx-auto">
              Powerful features that transform how you manage your time and appointments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              Three simple steps to<br className="hidden sm:block" /> scheduling freedom
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(s => <StepCard key={s.num} {...s} />)}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
              Loved by professionals worldwide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => <TestimonialCard key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 px-6">
        {/* Indigo gradient bg */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
        />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to take control of<br className="hidden sm:block" /> your schedule?
          </h2>
          <p className="text-base text-indigo-200 mb-10 max-w-md mx-auto leading-relaxed">
            Join thousands of professionals who've reclaimed their time. Start free, no credit card required.
          </p>
          <button
            onClick={goToApp}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
          >
            Get started for free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <button onClick={goToApp} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">ScheduleFlow</span>
          </button>

          <p className="text-xs text-gray-400 text-center">
            © {new Date().getFullYear()} ScheduleFlow. Built for seamless scheduling.
          </p>

          <div className="flex items-center gap-6">
            {['Privacy', 'Terms'].map(link => (
              <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
