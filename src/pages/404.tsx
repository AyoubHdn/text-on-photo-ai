import Link from "next/link";
import Image from "next/image";
import { type NextPage } from "next";
import Head from "next/head";

const NotFoundPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Page Not Found | NameDesignAI</title>
        <meta
          name="description"
          content="The page you are looking for could not be found."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_45%,#f8fbff_100%)] px-4 py-16 text-slate-900 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_45%,#020617_100%)] dark:text-slate-100 sm:px-6">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14">
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,#fde68a_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.28)_0%,transparent_65%)]" />

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex items-center gap-3">
                  <Image
                    src="/logo.webp"
                    alt="NameDesignAI"
                    width={44}
                    height={44}
                    className="rounded-full"
                  />
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
                    NameDesignAI
                  </span>
                </div>

                <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                  Error 404
                </p>

                <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
                  This page is missing, but your design journey is not.
                </h1>

                <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
                  The link may be outdated or the page may have moved. You can
                  go back to the homepage or jump straight into creating a design.
                </p>

                <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
                  <Link
                    href="/"
                    className="flex-1 rounded-2xl bg-[#2563EB] px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
                  >
                    Go To Homepage
                  </Link>
                  <Link
                    href="/name-art"
                    className="flex-1 rounded-2xl border border-slate-300 px-5 py-4 text-center font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Start Creating
                  </Link>
                </div>

                <div className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Popular
                    </div>
                    <div className="mt-2 text-sm font-medium">Arabic Name Art</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Gift Idea
                    </div>
                    <div className="mt-2 text-sm font-medium">Personalized Mug Designs</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Explore
                    </div>
                    <div className="mt-2 text-sm font-medium">Couples & Name Art</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFoundPage;
