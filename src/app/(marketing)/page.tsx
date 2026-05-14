import Link from 'next/link'
import {
  ArrowRight,
  Zap,
  BarChart3,
  ShieldCheck,
  Clock,
  ImagePlus,
  Globe,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

// ── Data ────────────────────────────────────────────
const STATS = [
  { value: '10K+',    label: 'Polls Created'   },
  { value: '50K+',    label: 'Responses'       },
  { value: '<50ms',   label: 'Avg Latency'     },
  { value: '99.99%',  label: 'Uptime'          },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Sharing',
    desc:  'Share a link. Anyone responds instantly. Zero app installs.',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc:  'Watch the dashboard update in real-time as votes come in.',
  },
  {
    icon: ShieldCheck,
    title: 'Access Control',
    desc:  'Open to all, or restrict to authenticated users only.',
  },
  {
    icon: Clock,
    title: 'Auto Expiry',
    desc:  'Set a window. The poll closes itself when time runs out.',
  },
  {
    icon: ImagePlus,
    title: 'Rich Media',
    desc:  'Embed images, GIFs, or videos directly into your questions.',
  },
  {
    icon: Globe,
    title: 'Public Results',
    desc:  'Publish final results publicly through the same link.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create Your Poll',
    desc:  'Add questions, set options, configure expiry and access.',
  },
  {
    step: '02',
    title: 'Share The Link',
    desc:  'Copy your unique link and send it anywhere — no login for voters.',
  },
  {
    step: '03',
    title: 'Watch Results Live',
    desc:  'Your dashboard updates in real-time as responses arrive.',
  },
]

// ── Page ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      {/* ── HERO ─────────────────────────────────── */}
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center
                   min-h-screen text-center px-4 pt-20 pb-16 overflow-hidden"
      >
        {/* Background glow */}
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2
                     w-[700px] h-[350px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.05) 0%, transparent 70%)',
          }}
        />
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5
                       rounded-full border border-white/10 bg-white/[0.04]
                       text-white/50 text-xs font-body tracking-wide"
          >
            <span className="live-dot" />
            Real-time polls. Built for speed.
          </span>

          {/* Heading */}
          <h1
            className="font-display font-semibold text-white leading-[1.05]
                       tracking-[-0.03em]
                       text-[48px] sm:text-[64px] md:text-[80px]"
          >
            Create Polls That
            <br />
            Get Responses.
          </h1>

          {/* Subtitle */}
          <p className="font-body text-white/50 text-lg max-w-xl leading-relaxed">
            Share a link. Collect feedback. Watch results update live —
            no login required for your audience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link href="/register">
              <Button size="lg" variant="default" className="gap-2 font-display">
                Create Your First Poll
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline">
                View Live Demo
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="font-body text-white/25 text-sm tracking-wide mt-1">
            ✦ No credit card &nbsp;✦ Free forever &nbsp;✦ Live in 30 seconds
          </p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────── */}
      <section id="stats" className="border-y border-white/[0.06] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 divide-y-0 md:divide-x md:divide-white/[0.06]">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 text-center px-6"
              >
                <span className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight">
                  {s.value}
                </span>
                <span className="font-body text-white/35 text-xs uppercase tracking-widest">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-16">
            <p className="font-body text-white/30 text-xs uppercase tracking-widest mb-3">
              System Architecture
            </p>
            <h2 className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight">
              Everything you need
              <br />
              <span className="text-white/40">to gather insights.</span>
            </h2>
          </div>

          {/* 2×3 Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="group flex flex-col gap-4 p-6 rounded-2xl
                             bg-white/[0.02] border border-white/[0.06]
                             hover:bg-white/[0.04] hover:border-white/[0.10]
                             transition-all duration-200"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               bg-white/[0.06] border border-white/[0.08]
                               group-hover:bg-white/[0.10] transition-colors"
                  >
                    <Icon className="w-5 h-5 text-white/70" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display font-semibold text-white text-base">
                      {f.title}
                    </h3>
                    <p className="font-body text-white/45 text-sm leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────── */}
      <section
        id="how-it-works"
        className="py-24 px-4 border-t border-white/[0.06]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-body text-white/30 text-xs uppercase tracking-widest mb-3">
              Execution Workflow
            </p>
            <h2 className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight">
              Up and running
              <br />
              <span className="text-white/40">in 3 simple steps.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative flex flex-col gap-5 p-7 rounded-2xl
                                              bg-white/[0.02] border border-white/[0.06]">
                {/* Step number watermark */}
                <span
                  className="font-display font-semibold text-[64px] leading-none
                             text-white/[0.04] absolute top-4 right-5 select-none"
                >
                  {item.step}
                </span>

                {/* Step indicator */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border border-white/[0.12]
                               flex items-center justify-center"
                  >
                    <span className="font-display text-xs font-semibold text-white/50">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="flex-1 h-px bg-white/[0.06] hidden md:block" />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-display font-semibold text-white text-lg">
                    {item.title}
                  </h3>
                  <p className="font-body text-white/45 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/[0.06]">
        <div
          className="max-w-3xl mx-auto text-center flex flex-col
                     items-center gap-6"
        >
          <h2 className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight">
            Ready to hear
            <br />
            what people think?
          </h2>
          <p className="font-body text-white/45 text-lg max-w-md">
            Join thousands of creators collecting feedback in real-time.
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/register">
              <Button size="xl" variant="default" className="gap-2 font-display">
                Start for Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="xl" variant="ghost">
                Sign in
              </Button>
            </Link>
          </div>
          <p className="font-body text-white/20 text-xs">
            ✦ No credit card &nbsp;✦ Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
