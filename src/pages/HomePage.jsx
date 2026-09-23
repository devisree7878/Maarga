import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Target,
  CalendarDays,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const JOURNEY = [
  {
    icon: Compass,
    title: 'DISCOVER',
    text: 'Find what matters',
  },
  {
    icon: Target,
    title: 'FOCUS',
    text: 'Choose your direction',
  },
  {
    icon: CalendarDays,
    title: 'RHYTHM',
    text: 'Build your routine',
  },
  {
    icon: TrendingUp,
    title: 'MOMENTUM',
    text: 'Keep moving forward',
  },
  {
    icon: Sparkles,
    title: 'MILESTONE',
    text: 'See your progress',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#030712] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">

        {/* Main atmospheric glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(99,72,180,0.25),transparent_55%)]" />

        <div className="absolute left-1/2 top-[25%] h-72 w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" />

        {/* Stars */}
        <div className="absolute left-[12%] top-[17%] h-1 w-1 rounded-full bg-white/60" />
        <div className="absolute left-[23%] top-[11%] h-1 w-1 rounded-full bg-violet-200/70" />
        <div className="absolute right-[17%] top-[18%] h-1 w-1 rounded-full bg-white/50" />
        <div className="absolute right-[29%] top-[10%] h-1 w-1 rounded-full bg-blue-200/50" />
        <div className="absolute left-[42%] top-[16%] h-1 w-1 rounded-full bg-white/40" />

        {/* Summit glow */}
        <div className="absolute left-1/2 top-[32%] h-24 w-24 -translate-x-1/2 rounded-full bg-violet-300/10 blur-2xl" />
      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="relative z-30 flex items-center justify-between px-6 py-5 md:px-10 lg:px-16">

        {/* MAARGA logo */}
        <Link
          to="/"
          className="group flex items-center gap-3"
        >

          <div className="relative flex h-10 w-10 items-center justify-center">

            <div className="absolute inset-0 rounded-xl bg-violet-500/30 blur-md transition group-hover:bg-violet-500/50" />

            {/* Mountain + path logo */}
            <svg
              viewBox="0 0 48 48"
              className="relative h-10 w-10"
              fill="none"
            >
              <defs>
                <linearGradient
                  id="maargaLogo"
                  x1="6"
                  y1="40"
                  x2="42"
                  y2="7"
                >
                  <stop stopColor="#60A5FA" />
                  <stop offset="0.5" stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#E879F9" />
                </linearGradient>
              </defs>

              {/* Mountain */}
              <path
                d="M6 39L19 13L25 25L31 9L42 39"
                stroke="url(#maargaLogo)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Rising path */}
              <path
                d="M11 35C17 32 21 29 24 25C28 21 31 18 37 14"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Destination */}
              <circle
                cx="37"
                cy="14"
                r="2.5"
                fill="white"
              />
            </svg>

          </div>

          <span className="text-sm font-semibold tracking-[0.35em]">
            MAARGA
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 md:gap-4">

          <Link
            to="/login"
            className="rounded-full px-4 py-2.5 text-sm text-slate-300 transition hover:text-white"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold backdrop-blur-md transition hover:border-violet-400/60 hover:bg-violet-500/10"
          >
            Get started
          </Link>

        </nav>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-78px)] max-w-7xl flex-col px-5">

        {/* =================================================
            HERO
        ================================================== */}

        <section className="relative z-20 flex flex-col items-center pt-3 text-center sm:pt-5 md:pt-7">

          {/* Small brand statement */}
          <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.45em] text-violet-300/75 sm:text-[11px]">
            Your path starts here
          </div>

          {/* MAARGA */}
          <h1 className="text-6xl font-black tracking-[-0.07em] sm:text-7xl md:text-8xl lg:text-[96px]">

            <span className="bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-transparent">
              MAARGA
            </span>

          </h1>

          {/* Headline */}
          <h2 className="mt-2 text-2xl font-light leading-[1.2] tracking-tight sm:text-3xl md:text-4xl">

            Find your{' '}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text font-medium text-transparent">
              direction.
            </span>

            <br />

            Build your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-fuchsia-400 bg-clip-text font-medium text-transparent">
              path.
            </span>

          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
            Turn what you want to become into a path you can follow every day.
          </p>

          {/* CTA */}
          <Link
            to="/register"
            className="group mt-5 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-blue-400 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(124,58,237,0.4)] transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_60px_rgba(124,58,237,0.6)]"
          >

            Start your journey

            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1">
              <ArrowRight size={15} />
            </span>

          </Link>

        </section>

        {/* =================================================
            MOUNTAIN + PATH
        ================================================== */}

        <section className="relative mx-auto -mt-8 h-[330px] w-full max-w-6xl sm:-mt-10 sm:h-[360px] md:-mt-12 md:h-[390px]">

          {/* Distant mountains */}
          <div
            className="absolute bottom-0 left-1/2 h-[220px] w-[900px] -translate-x-1/2 opacity-50"
            style={{
              clipPath:
                'polygon(0 100%, 10% 72%, 18% 84%, 28% 55%, 37% 76%, 48% 42%, 57% 70%, 68% 48%, 77% 75%, 88% 51%, 100% 72%, 100% 100%)',
              background:
                'linear-gradient(180deg,#312e81 0%,#111827 75%)',
            }}
          />

          {/* Main mountain */}
          <div
            className="absolute bottom-0 left-1/2 h-[330px] w-[800px] -translate-x-1/2"
            style={{
              clipPath:
                'polygon(0 100%,18% 68%,30% 80%,50% 8%,70% 80%,83% 64%,100% 100%)',
              background:
                'linear-gradient(145deg,#111827 5%,#0f172a 55%,#020617 100%)',
            }}
          />

          {/* Mountain highlight */}
          <div
            className="absolute bottom-0 left-1/2 h-[330px] w-[800px] -translate-x-1/2 opacity-60"
            style={{
              clipPath:
                'polygon(50% 8%,63% 72%,55% 51%,50% 8%,42% 53%,36% 74%)',
              background:
                'linear-gradient(180deg,rgba(167,139,250,.38),transparent)',
            }}
          />

          {/* Glowing journey path */}
          <svg
            viewBox="0 0 1000 400"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >

            <defs>

              <linearGradient
                id="journeyPath"
                x1="0"
                y1="1"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="45%" stopColor="#8B5CF6" />
                <stop offset="75%" stopColor="#C4B5FD" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>

              <filter id="pathGlow">
                <feGaussianBlur
                  stdDeviation="7"
                  result="blur"
                />

                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>

              </filter>

            </defs>

            {/* Path glow */}
            <path
              d="M270 400
                 C250 350 470 340 440 295
                 C410 250 570 240 545 200
                 C520 160 630 150 610 115
                 C595 90 535 70 500 38"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="18"
              opacity=".2"
              filter="url(#pathGlow)"
            />

            {/* Main path */}
            <path
              d="M270 400
                 C250 350 470 340 440 295
                 C410 250 570 240 545 200
                 C520 160 630 150 610 115
                 C595 90 535 70 500 38"
              fill="none"
              stroke="url(#journeyPath)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#pathGlow)"
            />

            {/* Summit */}
            <circle
              cx="500"
              cy="38"
              r="6"
              fill="white"
              filter="url(#pathGlow)"
            />

          </svg>

          {/* =================================================
              GIRL SILHOUETTE
          ================================================== */}

          <div className="absolute bottom-[15%] left-1/2 z-20 -translate-x-1/2">

            <div className="relative h-28 w-14">

              {/* Hair / head */}
              <div className="absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 rounded-full bg-[#05070d]" />

              {/* Body */}
              <div className="absolute left-1/2 top-6 h-16 w-9 -translate-x-1/2 rounded-t-[18px] bg-gradient-to-b from-[#090b14] to-[#020308]" />

              {/* Backpack */}
              <div className="absolute left-[6px] top-8 h-12 w-5 rounded-lg bg-[#111321]" />

              {/* Left leg */}
              <div className="absolute left-[18px] top-[65px] h-14 w-3 rotate-[8deg] rounded-full bg-[#03040a]" />

              {/* Right leg */}
              <div className="absolute left-[30px] top-[65px] h-14 w-3 -rotate-[8deg] rounded-full bg-[#03040a]" />

              {/* Walking stick */}
              <div className="absolute left-[45px] top-8 h-24 w-[2px] rotate-[8deg] origin-top bg-slate-500/60" />

            </div>

          </div>

          {/* Atmospheric foreground glow */}
          <div className="absolute bottom-0 left-1/2 h-28 w-[650px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px]" />

        </section>

        {/* =================================================
            JOURNEY STRIP
        ================================================== */}

        <section className="relative mt-auto -translate-y-2 pb-5 md:-translate-y-3 md:pb-6">

          {/* Connecting line */}
          <div className="absolute left-[8%] right-[8%] top-[22px] hidden h-px bg-gradient-to-r from-violet-500/20 via-violet-400/70 to-blue-400/20 md:block" />

          <div className="grid grid-cols-2 gap-5 md:grid-cols-5 md:gap-2">

            {JOURNEY.map((item, index) => {

              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  to="/register"
                  className={`group flex flex-col items-center text-center ${
                    index === 4
                      ? 'col-span-2 md:col-span-1'
                      : ''
                  }`}
                >

                  {/* Icon */}
                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/60 bg-[#050817]/90 shadow-[0_0_22px_rgba(124,58,237,.3)] backdrop-blur-xl transition duration-300 group-hover:border-violet-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,.5)]">

                    <Icon
                      size={17}
                      strokeWidth={1.7}
                      className="text-violet-300 transition group-hover:text-white"
                    />

                  </div>

                  {/* Title */}
                  <p className="mt-2.5 text-[9px] font-bold tracking-[0.28em] text-white">
                    {item.title}
                  </p>

                  {/* Meaning */}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {item.text}
                  </p>

                </Link>
              );

            })}

          </div>

        </section>

      </main>
    </div>
  );
}