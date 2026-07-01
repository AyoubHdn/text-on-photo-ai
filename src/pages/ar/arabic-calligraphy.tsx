import { type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FiCpu,
  FiDownload,
  FiGlobe,
  FiImage,
  FiLayers,
  FiPenTool,
  FiShare2,
} from "react-icons/fi";

import { LanguageSwitchLink } from "~/component/LanguageSwitchLink";
import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildFAQSchema } from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";

const galleryItems = [
  {
    src: "/styles/arabic/thuluth-gold.webp",
    title: "Thuluth",
    href: "/arabic-calligraphy/styles/thuluth",
  },
  {
    src: "/styles/arabic/diwani-modern.webp",
    title: "Diwani Modern",
    href: "/arabic-calligraphy/styles/diwani-modern",
  },
  {
    src: "/styles/arabic/diwani-ink.webp",
    title: "Diwani",
    href: "/arabic-calligraphy/styles/diwani",
  },
  {
    src: "/styles/arabic/marble-gold.webp",
    title: "Marble Gold",
    href: "/arabic-calligraphy/styles/marble-gold",
  },
  {
    src: "/styles/arabic/ruqah-classic.webp",
    title: "Ruq'ah Classic",
    href: "/arabic-calligraphy/styles/ruqah-classic",
  },
  {
    src: "/styles/arabic/henna.webp",
    title: "Henna",
    href: "/arabic-calligraphy/styles/henna",
  },
  {
    src: "/styles/arabic/crystal.webp",
    title: "Crystal",
    href: "/arabic-calligraphy/styles/crystal",
  },
  {
    src: "/styles/arabic/kufic-ornate.webp",
    title: "Ornate Kufic",
    href: "/arabic-calligraphy/styles/ornate-kufic",
  },
];

// REVIEW_AR: All Arabic marketing copy on this page is a strong first draft and should be refined by a native Arabic copywriter before publishing.
const arabicFaqs = [
  {
    question: "هل يمكن كتابة الخط العربي بالذكاء الاصطناعي مجانًا؟",
    answer:
      "يمكنك استكشاف الأنماط ومعاينة الفكرة مجانًا، ثم استخدام الرصيد عند إنشاء النسخة النهائية عالية الجودة أو الجاهزة للتنزيل.",
  },
  {
    question: "ما أنواع الخطوط العربية المتاحة داخل الأداة؟",
    answer:
      "يمكنك تجربة زخرفة الخط العربي بأنماط متعددة مثل الثلث والديواني والكوفي، إلى جانب أساليب رقمية حديثة تمنح الاسم أو العبارة حضورًا بصريًا أكثر فخامة أو جرأة.",
  },
  {
    question:
      "هل أستطيع الحصول على زخرفة عربية احترافية بالتشكيل أو كتابة الاسم بالتشكيل؟",
    answer:
      "نعم، يمكنك إدخال الاسم أو العبارة بالشكل الذي تفضله ثم تجربة مخرجات أقرب إلى زخرفة عربية احترافية بالتشكيل، مع اختلاف النتيجة بحسب النمط المختار وطريقة كتابة النص.",
  },
  {
    question: "هل يمكنني تنزيل تصميم الخط العربي؟",
    answer:
      "نعم، يتم تنزيل كل تصميم كصورة PNG عالية الدقة وبدون علامة مائية، جاهزة لمواقع التواصل أو صورتك الشخصية أو الاستخدام الرقمي.",
  },
];

/* HIDDEN W1 — productLinks: links to /arabic-calligraphy/products, /personalized-gifts,
   /arabic-calligraphy/products/wall-art — orphaned physical pages, not linked from this page.
const productLinks = [
  {
    href: "/arabic-calligraphy/products",
    title: "منتجات الخط العربي",
    description:
      "استكشف كيف تتحول كتابة الخط العربي بالذكاء الاصطناعي إلى منتجات قابلة للطباعة والعرض.",
  },
  {
    href: "/personalized-gifts",
    title: "هدايا عربية مخصصة",
    description:
      "استخدم تصميمات الخط العربي في هدايا جاهزة للمناسبات الشخصية والعائلية والرسمية.",
  },
  {
    href: "/arabic-calligraphy/products/wall-art",
    title: "لوحات الخط العربي",
    description:
      "حوّل الاسم أو العبارة إلى لوحة زخرفة خط عربي تناسب الديكور أو الإهداء أو الهوية البصرية.",
  },
];
*/

const ArabicCalligraphyLandingArabicPage: NextPage = () => {
  return (
    <>
      <SeoHead
        title="زخرفة الخط العربي بالذكاء الاصطناعي | اكتب اسمك بأي خط عربي أون لاين | Name Design AI"
        description="أنشئ زخرفة الخط العربي واكتب اسمك بأي خط عربي أون لاين باستخدام الذكاء الاصطناعي. جرّب الثلث والديواني والكوفي واحصل على زخرفة عربية احترافية أو كتابة عربية بالتشكيل خلال دقائق."
        path="/ar/arabic-calligraphy"
        keywords="زخرفة خط عربي, زخرفة خطوط عربي, زخرفة الخط العربي, كتابة الخط العربي بالذكاء الاصطناعي, اكتب اسمك بأي خط عربي اون لاين, زخرفة عربية احترافية, زخرفة عربية احترافية بالتشكيل"
        alternates={[
          { hrefLang: "en", href: "/arabic-calligraphy" },
          { hrefLang: "ar", href: "/ar/arabic-calligraphy" },
          { hrefLang: "x-default", href: "/arabic-calligraphy" },
        ]}
        jsonLd={[
          buildCollectionPageSchema({
            name: "زخرفة الخط العربي بالذكاء الاصطناعي",
            description:
              "صفحة عربية مخصصة لكتابة الخط العربي بالذكاء الاصطناعي وتجربة أنماط الثلث والديواني والكوفي والزخرفة العربية الاحترافية.",
            path: "/ar/arabic-calligraphy",
          }),
          buildFAQSchema(arabicFaqs),
        ]}
      />

      <main lang="ar" dir="rtl" className="bg-white text-right">
        {/* REVIEW_AR: Hero copy should be polished by a native Arabic copywriter before publishing. */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 py-24 text-center dark:from-gray-800 dark:to-gray-900 lg:py-32">
          <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-5" />

          <div className="container relative z-10 mx-auto">
            <div className="mb-6 flex">
              <LanguageSwitchLink
                href="/arabic-calligraphy"
                label="English"
                className="ml-auto"
              />
            </div>
            <span className="mb-6 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold tracking-wide text-brand-800">
              الخط العربي والزخرفة الاحترافية
            </span>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-7xl">
              زخرفة الخط العربي واكتب اسمك بخط عربي أون لاين
            </h1>
            <h2 className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 md:text-2xl">
              كتابة الخط العربي بالذكاء الاصطناعي تمنحك مساحة لتجربة الثلث
              والديواني والكوفي وأنماط زخرفة عربية احترافية بالتشكيل، مع نتائج
              تركز على شكل الحروف والإيقاع البصري للخط لا على زخرفة الاسم العامة.
            </h2>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/ar/arabic-calligraphy-generator">
                <button className="w-full rounded-xl bg-brand-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-brand-700 hover:shadow-2xl sm:w-auto">
                  ابدأ كتابة اسمك بخط عربي
                </button>
              </Link>
              <Link href="#gallery">
                <button className="w-full rounded-xl border-2 border-cream-200 bg-white px-8 py-4 text-lg font-bold text-gray-700 transition hover:border-cream-300 hover:bg-cream-50 sm:w-auto">
                  شاهد أنماط الخط
                </button>
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              إذا كنت تبحث عن أنماط أوسع للأسماء والتصاميم الزخرفية غير العربية،
              فيمكنك زيارة{" "}
              <Link
                href="/name-art"
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                صفحة Name Art الرئيسية
              </Link>
              .
            </p>
          </div>
        </section>

        {/* REVIEW_AR: Showcase copy should be refined by a native Arabic speaker before publishing. */}
        <section id="gallery" className="bg-cream-50 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                استكشف أنماط زخرفة الخط العربي
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                من الثلث الفاخر إلى الديواني الانسيابي والكوفي الهندسي، هذه الصفحة
                مخصصة لمن يريد كتابة اسمه بأي خط عربي أون لاين مع تركيز واضح على
                شكل الخط نفسه.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {galleryItems.map((style) => (
                <Link
                  key={style.title}
                  href={style.href}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={style.src}
                      alt={getStyleImageAlt(style.src, {
                        kind: "arabic",
                        title: style.title,
                        fallbackAlt: `${style.title} Arabic calligraphy style example`,
                      })}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-lg font-bold text-white">
                      {style.title}
                    </span>
                    <span className="mt-2 text-sm font-medium text-white/90">
                      جرّب هذا الخط داخل الأداة
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="mb-4">
                <Link
                  href="/arabic-calligraphy/styles"
                  className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-200"
                >
                  تصفح جميع أنماط الخط
                </Link>
              </div>
              <Link href="/ar/arabic-calligraphy-generator">
                <button className="inline-block rounded-full bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-brand-700 hover:shadow-xl">
                  جرّب هذه الأنماط الآن
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* REVIEW_AR: Workflow copy should be refined by a native Arabic speaker before publishing. */}
        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                كيف تعمل كتابة الخط العربي بالذكاء الاصطناعي
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                ثلاث خطوات سريعة للحصول على زخرفة خط عربي متوازنة بصريًا وقابلة
                للاستخدام الرقمي والمشاركة.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 text-center md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <FiPenTool className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">
                  1. اكتب الاسم أو العبارة
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  أدخل النص الذي تريد تحويله إلى خط عربي مزخرف، مع إمكانية تجربة
                  الكتابة العادية أو الكتابة بالتشكيل.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <FiLayers className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">2. اختر نوع الخط</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  جرّب زخرفة خطوط عربي مستوحاة من الثلث أو الديواني أو الكوفي أو
                  من أساليب معاصرة أقرب إلى الزخرفة الاحترافية.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <FiDownload className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">3. احصل على التصميم</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  أنشئ النتيجة النهائية، ثم نزّلها بدقة عالية واستخدمها في مواقع
                  التواصل أو صورتك الشخصية أو أعمالك الرقمية.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEW_AR: Utility copy should be refined by a native Arabic speaker before publishing. */}
        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">
                استخدامات زخرفة الخط العربي
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                يمكن توظيف كتابة الخط العربي بالذكاء الاصطناعي في مواقع التواصل
                والعرض الرقمي والأعمال الإبداعية.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiShare2 className="mb-4 text-4xl text-amber-500" />
                <h3 className="mb-3 text-2xl font-bold">
                  مشاركة على مواقع التواصل
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  استخدم تصميمك صورةً شخصية أو منشورًا مميزًا على منصات التواصل
                  الاجتماعي.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiImage className="mb-4 text-4xl text-brand-600" />
                <h3 className="mb-3 text-2xl font-bold">
                  عمل فني رقمي
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  حوّل الاسم إلى لوحة خط عربي رقمية عالية الدقة جاهزة للعرض
                  والمشاركة.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiCpu className="mb-4 text-4xl text-purple-500" />
                <h3 className="mb-3 text-2xl font-bold">
                  استخدامات رقمية يومية
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  وظّف الخط الناتج في الصور الشخصية والبنرات والمنشورات أو في
                  عروض الهوية الشخصية والمشاريع الإبداعية.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HIDDEN W1 — "خطواتك التالية" section: linked to /arabic-calligraphy/products,
            /personalized-gifts, /arabic-calligraphy/products/wall-art. Orphaned physical pages.
        <section className="bg-cream-50 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-bold md:text-4xl">
                خطواتك التالية بعد إنشاء الخط
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                بعد تجربة زخرفة خط عربي داخل الأداة، يمكنك الانتقال إلى الصفحات
                الأكثر ارتباطًا بالطباعة والتخصيص والاستفادة التجارية.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {link.title}
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        */}

        {/* REVIEW_AR: FAQ copy should be refined by a native Arabic speaker before publishing. */}
        <section className="bg-cream-50 py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              أسئلة شائعة حول الخط العربي أون لاين
            </h2>
            <div className="space-y-4">
              {arabicFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-cream-100 bg-white p-6 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {faq.question}
                    </h3>
                    <span className="text-2xl font-bold text-slate-400 transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEW_AR: Closing CTA copy should be refined by a native Arabic speaker before publishing. */}
        <section className="bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-24 text-center text-white">
          <div className="container mx-auto">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              اكتب اسمك بأي خط عربي أون لاين الآن
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-brand-100">
              جرّب كتابة الخط العربي بالذكاء الاصطناعي، وابدأ من الثلث أو
              الديواني أو الكوفي حتى تصل إلى زخرفة عربية احترافية تناسب غرضك.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/ar/arabic-calligraphy-generator">
                <button className="transform rounded-full bg-white px-10 py-5 text-lg font-bold text-brand-800 shadow-2xl transition hover:-translate-y-1 hover:bg-brand-50">
                  افتح أداة الخط العربي
                </button>
              </Link>
              <Link
                href="/name-art"
                className="rounded-full border border-white/40 px-8 py-5 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                انتقل إلى صفحة Name Art
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ArabicCalligraphyLandingArabicPage;
