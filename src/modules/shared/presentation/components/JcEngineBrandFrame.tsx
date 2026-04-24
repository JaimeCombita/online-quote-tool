import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { brandCssVariables, jcBrandConfig } from "../../branding/brand.config";

interface JcEngineBrandFrameProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle: string;
  pageTag?: string;
  topRightContent?: ReactNode;
}

export function JcEngineBrandFrame({
  children,
  pageTitle,
  pageSubtitle,
  pageTag = "JC Engine",
  topRightContent,
}: JcEngineBrandFrameProps) {
  return (
    <div className="jc-app-bg flex min-h-screen flex-col" style={brandCssVariables}>
      <header className="jc-shell-border border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src={jcBrandConfig.assets.logoMain}
              alt={`${jcBrandConfig.app.name} logo`}
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl border border-[var(--jc-neutral-200)] bg-white object-contain p-1"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--jc-primary-500)]">
                {jcBrandConfig.app.name}
              </p>
              <p className="mt-1 text-sm text-[var(--jc-neutral-600)]">{jcBrandConfig.app.tagline}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-5 text-sm text-[var(--jc-neutral-600)] sm:flex">
            {jcBrandConfig.links.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[var(--jc-primary-600)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:py-10">
        <section className="jc-hero-gradient mb-6 rounded-3xl border border-[var(--jc-primary-400)]/20 p-7 text-white shadow-[0_18px_50px_rgba(15,23,42,0.24)] sm:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--jc-primary-100)]">{pageTag}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{pageTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm text-[var(--jc-primary-100)] sm:text-base">
                {pageSubtitle}
              </p>
            </div>

            {topRightContent && <div className="shrink-0">{topRightContent}</div>}
          </div>
        </section>

        {children}
      </main>

      <footer className="jc-shell-border border-t bg-[var(--jc-neutral-950)] text-[var(--jc-neutral-200)]">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 sm:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--jc-primary-300)]">
              {jcBrandConfig.app.legalName}
            </p>
            <p className="mt-2 text-sm text-[var(--jc-neutral-300)]">{jcBrandConfig.app.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {jcBrandConfig.links.social.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--jc-neutral-700)] px-3 py-1.5 text-xs text-[var(--jc-neutral-200)] transition hover:border-[var(--jc-primary-400)] hover:text-white"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-sm sm:text-right">
            <p>{jcBrandConfig.contact.email}</p>
            <p>{jcBrandConfig.contact.phone}</p>
            <p>{jcBrandConfig.contact.city}</p>
            <p className="pt-2 text-xs text-[var(--jc-neutral-400)]">
              © {jcBrandConfig.contact.copyrightYear} {jcBrandConfig.app.name}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function BackToDashboardLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
    >
      ← Volver al dashboard
    </Link>
  );
}