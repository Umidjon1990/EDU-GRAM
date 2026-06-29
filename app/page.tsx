import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { landingDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = landingDictionary;

const highlights = [
  {
    icon: MessageSquareText,
    title: t.highlights.chat.title,
    text: t.highlights.chat.text,
  },
  {
    icon: BookOpenCheck,
    title: t.highlights.assignments.title,
    text: t.highlights.assignments.text,
  },
  {
    icon: ShieldCheck,
    title: t.highlights.private.title,
    text: t.highlights.private.text,
  },
];

const classroomItems = [
  t.classroom.items.groups,
  t.classroom.items.voice,
  t.classroom.items.tests,
  t.classroom.items.files,
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <GraduationCap aria-hidden className="size-6" />
          </span>
          <span className="text-lg font-bold tracking-normal">Modern Edu</span>
        </Link>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">{t.nav.login}</Link>
          </Button>
          <Button asChild>
            <Link href="/login">
              {t.nav.start}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5.25rem)] w-full max-w-7xl items-center gap-10 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles aria-hidden className="size-4 text-accent" />
            {t.hero.badge}
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-foreground sm:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {t.hero.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                {t.hero.primaryAction}
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="#classroom">{t.hero.secondaryAction}</Link>
            </Button>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {t.metrics.map((metric) => (
              <div
                className="rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur"
                key={metric.label}
              >
                <dt className="text-sm text-muted-foreground">{metric.label}</dt>
                <dd className="mt-1 text-2xl font-black">{metric.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative min-h-[28rem] lg:min-h-[42rem]">
          <div className="absolute inset-x-4 bottom-0 top-8 rounded-[2rem] border border-border bg-card/70 shadow-2xl shadow-primary/10 backdrop-blur md:inset-x-8" />
          <Image
            priority
            alt={t.hero.imageAlt}
            className="relative z-10 h-full min-h-[28rem] w-full rounded-[2rem] object-cover shadow-2xl shadow-black/10"
            height={1200}
            src="/images/modern-edu-classroom.png"
            width={1600}
          />
          <div className="absolute bottom-6 left-6 right-6 z-20 grid gap-3 rounded-3xl border border-white/40 bg-white/85 p-4 shadow-xl backdrop-blur dark:border-white/10 dark:bg-card/85 sm:left-auto sm:w-80">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  {t.classroom.label}
                </p>
                <p className="mt-1 text-xl font-black">{t.classroom.title}</p>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success">
                {t.classroom.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {classroomItems.map((item) => (
                <span
                  className="rounded-2xl bg-muted px-3 py-2 text-sm font-semibold text-muted-foreground"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-y border-border bg-card/65 py-14 backdrop-blur"
        id="classroom"
      >
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {highlights.map((item) => (
            <article className="rounded-3xl p-6" key={item.title}>
              <item.icon aria-hidden className="size-8 text-primary" />
              <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
