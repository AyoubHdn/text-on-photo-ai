import { type ReactNode } from "react";

import { SeoHead } from "~/component/SeoHead";

type PagePosterLegalPageProps = {
  title: string;
  metaTitle: string;
  description: string;
  path: string;
  summary: string;
  children: ReactNode;
};

export function PagePosterLegalPage({
  title,
  metaTitle,
  description,
  path,
  summary,
  children,
}: PagePosterLegalPageProps) {
  return (
    <>
      <SeoHead title={metaTitle} description={description} path={path} />
      <main className="bg-gradient-to-b from-cream-100 via-cream-50 to-gray-100 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8 text-center sm:mb-10">
            <p className="mb-4 inline-flex rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-semibold text-brand-800 shadow-sm">
              PagePoster · Meta integration
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              {summary}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              Effective date: <time dateTime="2026-08-04">August 4, 2026</time>
            </p>
          </header>

          <article className="space-y-10 rounded-2xl border border-cream-200 bg-white p-6 text-base leading-7 text-slate-700 shadow-sm sm:p-10 lg:p-12">
            {children}
          </article>
        </div>
      </main>
    </>
  );
}

type LegalSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-4">
      <h2
        id={`${id}-heading`}
        className="scroll-mt-24 text-2xl font-bold tracking-tight text-slate-900"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export const legalLinkClassName =
  "font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export const legalListClassName =
  "ml-5 list-disc space-y-2 marker:text-brand-600";
