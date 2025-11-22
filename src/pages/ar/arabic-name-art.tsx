// src/pages/ar/arabic-name-art.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FiPenTool, FiLayers, FiDownload, FiStar, FiGlobe, FiCpu } from "react-icons/fi";

// Reuse the same gallery items (images don't need translation)
const galleryItems = [
  { src: "/styles/arabic/thuluth-gold.webp", title: "خط الثلث الذهبي" },
  { src: "/styles/arabic/wireframe.webp", title: "الإطار السلكي" },
  { src: "/styles/arabic/diwani-ink.webp", title: "الديواني الملكي" },
  { src: "/styles/arabic/gold-3d.webp", title: "ثلاثي الأبعاد فاخر" },
  { src: "/styles/arabic/smoke-art.webp", title: "فن الدخان" },
  { src: "/styles/arabic/sand-desert.webp", title: "رمال الصحراء" },
  { src: "/styles/arabic/diamond.webp", title: "مرصع بالألماس" },
  { src: "/styles/arabic/kufic-geo.webp", title: "كوفي هندسي" },
];

const ArabicArtLandingPageAr: NextPage = () => {
  return (
    <>
      <Head>
        <title>صانع الخط العربي بالذكاء الاصطناعي | زخرفة الأسماء | NameDesignAI</title>
        <meta
          name="description"
          content="حول اسمك إلى تحفة فنية بالخط العربي باستخدام الذكاء الاصطناعي. صمم بخط الثلث، الديواني، الكوفي، وتصاميم ثلاثية الأبعاد في ثوانٍ."
        />
        <meta 
          name="keywords" 
          content="تصميم اسم عربي, خط عربي بالذكاء الاصطناعي, زخرفة اسماء, صانع اللوجو العربي, خط الثلث, خط الديواني, رسم اسماء" 
        />
        {/* Canonical points to itself */}
        <link rel="canonical" href="https://www.namedesignai.com/ar/arabic-name-art" />
        {/* Link to the English version for SEO */}
        <link rel="alternate" hrefLang="en" href="https://www.namedesignai.com/arabic-name-art" />
      </Head>

      {/* DIR="RTL" IS CRITICAL HERE */}
      <main className="bg-white dark:bg-gray-900" dir="rtl">
        
        {/* --- Hero Section --- */}
        <section className="relative text-center py-24 lg:py-32 px-4 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto relative z-10">
            {/* --- ADD THIS BUTTON HERE --- */}
            <div className="flex justify-end mb-4">
            <Link href="/arabic-name-art">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all shadow-sm" dir="ltr">
                <FiGlobe className="text-blue-600" /> 
                <span>English</span>
                </button>
            </Link>
            </div>
            {/* --------------------------- */}
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold mb-6 tracking-wide">
              الأداة الأولى للخط العربي بالذكاء الاصطناعي
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
              حول اسمك إلى <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">تحفة فنية عربية</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              امزج بين أصالة التراث وقوة الذكاء الاصطناعي. صمم أسماء بخط الثلث، الديواني، وتصاميم ثلاثية الأبعاد مبهرة في لحظات.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/ar/arabic-name-art-generator">
                <button className="px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto">
                  صمم اسمك الآن
                </button>
              </Link>
              <Link href="#gallery">
                <button className="px-8 py-4 text-lg font-bold bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 w-full sm:w-auto">
                  شاهد الأمثلة
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- How It Works Section --- */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">الخط العربي أصبح سهلاً</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">لا تحتاج لخبرة في التصميم. فقط اكتب وابتكر.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 mb-6">
                  <FiPenTool className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">1. اكتب اسمك</h3>
                <p className="text-gray-600 dark:text-gray-400">اكتب الاسم باللغة العربية. النظام يدعم التشكيل والحروف العربية بالكامل.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-6">
                  <FiLayers className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">2. اختر النمط</h3>
                <p className="text-gray-600 dark:text-gray-400">اختر من بين الذهب الملكي، الحبر التقليدي، النيون المستقبلي، أو التصاميم ثلاثية الأبعاد.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-6">
                  <FiDownload className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">3. حمل الصورة</h3>
                <p className="text-gray-600 dark:text-gray-400">احصل على صورة عالية الدقة جاهزة للمشاركة، الطباعة، أو الاستخدام كشعار.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Showcase Gallery Section --- */}
        <section id="gallery" className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">أنماط تجمع بين الأصالة والحداثة</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">استكشف مجموعتنا المتنوعة من الفنون العربية المولدة بالذكاء الاصطناعي.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryItems.map((style) => (
                    <div key={style.title} className="group relative overflow-hidden rounded-xl shadow-lg cursor-pointer bg-white dark:bg-gray-700">
                        <div className="aspect-square relative">
                            <Image 
                                src={style.src} 
                                alt={style.title} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <span className="text-white font-bold text-lg">{style.title}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href="/ar/arabic-name-art-generator">
                <button className="inline-block px-10 py-4 text-lg font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  جرب هذه الأنماط الآن
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Use Cases Section --- */}
        <section className="py-24 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">أكثر من مجرد اسم</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">اكتشف إمكانيات لا حصر لها لتصاميمك العربية.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiStar className="text-4xl text-amber-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">الشعارات والهوية البصرية</h3>
                        <p className="text-gray-600 dark:text-gray-400">صمم شعارًا فريدًا غنيًا بالثقافة لشركتك أو علامتك التجارية باستخدام الخط الكوفي الهندسي أو الثلث الانسيابي.</p>
                    </div>
                    {/* Card 2 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiGlobe className="text-4xl text-blue-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">وسائل التواصل الاجتماعي</h3>
                        <p className="text-gray-600 dark:text-gray-400">تميز على انستجرام، تيك توك، وتويتر بصورة شخصية تمزج هويتك بلمسة فنية مذهلة.</p>
                    </div>
                    {/* Card 3 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiCpu className="text-4xl text-purple-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">الوشم والديكور</h3>
                        <p className="text-gray-600 dark:text-gray-400">صمم أفكارًا للوشم ذات معنى عميق أو اطبع فنًا عالي الدقة لتعليقه في منزلك أو مكتبك.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">الأسئلة الشائعة</h2>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">هل أحتاج إلى لوحة مفاتيح عربية؟</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            لا! الذكاء الاصطناعي لدينا ذكي بما يكفي لفهم الأسماء بالإنجليزية (مثل &quot;Ayoub&quot;) وتحويلها تلقائيًا إلى خط عربي مبهر. يمكنك الكتابة بأي لغة تفضلها.
                        </p>                    
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">هل يمكنني استخدام الصور كشعار؟</h3>
                        <p className="text-gray-600 dark:text-gray-300">نعم! الصور التي تنشئها ملك لك ويمكنك استخدامها في المشاريع الشخصية أو التجارية، بما في ذلك الشعارات والعلامات التجارية.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">ما هو نموذج الذكاء الاصطناعي المستخدم؟</h3>
                        <p className="text-gray-600 dark:text-gray-300">نستخدم نماذج متقدمة تم ضبطها خصيصًا لفهم التشكيل الفني والخط العربي لضمان نتائج عالية الجودة وتفاصيل دقيقة.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">جاهز لإنشاء تحفتك الفنية؟</h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">انضم لآلاف المستخدمين الذين يصممون فنًا إسلاميًا مذهلاً اليوم.</p>
                <Link href="/ar/arabic-name-art-generator">
                    <button className="px-10 py-5 text-lg font-bold bg-white text-blue-700 rounded-full hover:bg-blue-50 transition shadow-2xl transform hover:-translate-y-1">
                        ابدأ التصميم الآن
                    </button>
                </Link>
            </div>
        </section>
      </main>
    </>
  );
};

export default ArabicArtLandingPageAr;