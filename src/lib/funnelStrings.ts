import type { Locale } from "~/hook/useLocale";

type StringEntry = { en: string; ar?: string };

export const funnelStrings = {
  // ── buy-credits ─────────────────────────────────────────────────────────────
  buyCreditsHeading:       { en: "Unlock More Designs Instantly",                                          ar: "أنشئ المزيد من التصاميم فوراً" },
  pageSubtitle:            { en: "Choose a credit pack and continue generating, previewing, and refining your design without interruptions.", ar: "اختر باقة رصيد وواصل الإنشاء والتحسين دون انقطاع" },
  trustInstant:            { en: "⚡ Instant activation",                                                   ar: "⚡ تفعيل فوري" },
  trustSecure:             { en: "🔒 Secure payment via Stripe",                                            ar: "🔒 دفع آمن عبر Stripe" },
  trustCards:              { en: "💳 All major cards accepted",                                             ar: "💳 نقبل جميع البطاقات الرئيسية" },
  planStarterName:         { en: "Starter Plan",                                                           ar: "الباقة المبتدئة" },
  planStarterDesc:         { en: "Perfect for getting started quickly.",                                   ar: "مثالية للبدء بسرعة." },
  planProName:             { en: "Pro Plan",                                                               ar: "الباقة الاحترافية" },
  planProDesc:             { en: "Best for regular creators and testing variations.",                       ar: "الأفضل للمبدعين المنتظمين وتجربة التنويعات." },
  planEliteName:           { en: "Elite Plan",                                                             ar: "الباقة المتميزة" },
  planEliteDesc:           { en: "Ideal for power users and heavier sessions.",                            ar: "مثالية للمستخدمين المكثّفين والجلسات الأطول." },
  badgeBestValue:          { en: "Best Value",                                                             ar: "أفضل قيمة" },
  badgeMostPopular:        { en: "Most Popular",                                                           ar: "الأكثر شيوعاً" },
  designsIncluded:         { en: "{n} AI designs included",                                                ar: "يشمل {n} تصميماً بالذكاء الاصطناعي" },
  pricePerDesign:          { en: "${price} per design",                                                    ar: "{price}$ لكل تصميم" },
  planCtaLoading:          { en: "Processing...",                                                          ar: "جارٍ المعالجة..." },
  planCta:                 { en: "Get {n} Credits",                                                        ar: "احصل على {n} رصيد" },
  refundNote:              { en: "Please review our Refund Policy before buying credits.",                 ar: "يرجى مراجعة سياسة الاسترداد قبل شراء الرصيد." },
  whatYouCanDoHeading:     { en: "What you can do with credits",                                           ar: "ماذا يمكنك أن تفعل بالرصيد" },
  featureGenerateLabel:    { en: "Generate AI name art",                                                   ar: "إنشاء فن أسماء بالذكاء الاصطناعي" },
  featureGenerateDetail:   { en: "1 credit per Standard design",                                           ar: "رصيد واحد لكل تصميم قياسي" },
  featureRemoveBgLabel:    { en: "Remove background",                                                      ar: "إزالة الخلفية" },
  featureRemoveBgDetail:   { en: "1 credit — makes designs print-ready",                                   ar: "رصيد واحد — يجعل التصميم جاهزاً للطباعة" },
  featureDownloadLabel:    { en: "High-res download",                                                      ar: "تنزيل بدقة عالية" },
  featureDownloadDetail:   { en: "Free — always included",                                                 ar: "مجاناً — متضمَّن دائماً" },
  typicalUsageHeading:     { en: "Typical Session Usage",                                                  ar: "الاستخدام المعتاد في الجلسة" },
  typicalCostDesign:       { en: "Cost per design: about 1 credit",                                       ar: "تكلفة التصميم: نحو رصيد واحد" },
  typicalSession:          { en: "Most customers use 10-20 credits per session",                           ar: "يستخدم معظم العملاء 10–20 رصيداً في الجلسة" },
  purchaseError:           { en: "Something went wrong. Please try again.",                                ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." },

  // ── unlock/free-credit ───────────────────────────────────────────────────────
  unlockHeading:           { en: "Get {n} extra credits",                                                  ar: "احصل على {n} رصيد إضافي" },
  badgeNoPayment:          { en: "No payment required",                                                    ar: "بدون أي دفع" },
  badgeOptional:           { en: "Optional",                                                               ar: "اختياري" },
  badgeInstant:            { en: "Instant credit after completion",                                        ar: "رصيد فوري بعد الإكمال" },
  pageDesc:                { en: "Complete an optional survey and receive {n} extra credits immediately after a successful completion. If you are on the default 1-credit balance, that brings you to {total} total credits.", ar: "أكمل استبياناً اختيارياً واحصل على {n} رصيد إضافي فور إتمامه بنجاح. إن كان رصيدك الحالي رصيداً واحداً افتراضياً، فسيصبح إجمالي رصيدك {total}." },
  unlocksSectionLabel:     { en: "What {n} extra credits unlock",                                          ar: "ماذا يتيح لك {n} رصيد إضافي" },
  unlocksCard1Title:       { en: "{n} standard Name Art designs",                                          ar: "{n} تصميم فن أسماء قياسي" },
  unlocksCard1Desc:        { en: "Try multiple styles or names without paying.",                           ar: "جرّب أنماطاً أو أسماءً متعددة دون دفع." },
  unlocksCard2Title:       { en: "Or {n} background removals",                                             ar: "أو {n} عملية إزالة خلفية" },
  unlocksCard2Desc:        { en: "Clean exports for print, editing, or sharing.",                          ar: "ملفات نظيفة للطباعة أو التعديل أو المشاركة." },
  unlocksCard3Title:       { en: "{total} total credits on a new account",                                 ar: "{total} رصيد إجمالي على حساب جديد" },
  unlocksCard3Desc:        { en: "Enough for 1 Flux Dev generation if you start from the default balance.", ar: "يكفي لإنشاء واحد بنموذج Flux Dev إذا بدأت من الرصيد الافتراضي." },
  step1:                   { en: "Start the survey",                                                       ar: "ابدأ الاستبيان" },
  step2:                   { en: "Complete it successfully",                                               ar: "أكمله بنجاح" },
  step3:                   { en: "Credits are added instantly",                                            ar: "يُضاف الرصيد فوراً" },
  ctaOpening:              { en: "Opening survey...",                                                      ar: "جارٍ فتح الاستبيان..." },
  ctaDefault:              { en: "Get {n} Extra Credits",                                                  ar: "احصل على {n} رصيد إضافي" },
  loginPromptPre:          { en: "Please",                                                                 ar: "يرجى" },
  loginPromptLink:         { en: "sign in",                                                                ar: "تسجيل الدخول" },
  loginPromptPost:         { en: "to earn {n} extra credits.",                                             ar: "لكسب {n} رصيد إضافي." },
  // ar is intentionally identical for singular/plural — Arabic uses one neutral form
  cooldownMsg:             { en: "You already started a survey. Try again in {minutes} minute.",           ar: "لقد بدأت استبياناً بالفعل. حاول مجدداً بعد {minutes} دقيقة." },
  cooldownMsgPlural:       { en: "You already started a survey. Try again in {minutes} minutes.",          ar: "لقد بدأت استبياناً بالفعل. حاول مجدداً بعد {minutes} دقيقة." },
  dailyLimitDefault:       { en: "You already claimed free credits today. Try again tomorrow or buy credits.", ar: "لقد حصلت على رصيد مجاني اليوم. حاول غداً أو اشترِ رصيداً." },
  footerNote:              { en: "Surveys are optional and provided by a trusted research partner. VPNs and proxies must be disabled to ensure survey availability.", ar: "الاستبيانات اختيارية ومقدَّمة من شريك أبحاث موثوق. يجب تعطيل شبكات VPN والوكلاء لضمان توفّر الاستبيانات." },

  // ── success ──────────────────────────────────────────────────────────────────
  successHeading:          { en: "{count} credits added to your account",                                  ar: "تمت إضافة {count} رصيد إلى حسابك" },
  successHeadingGeneric:   { en: "Credits added to your account",                                          ar: "تمت إضافة الرصيد إلى حسابك" },
  successBody:             { en: "Jump back in and keep creating. Preview your design on a mug, shirt, or wall art — free from inside the generator.", ar: "عُد وواصل إنشاء تصاميمك." },
  continueBtn:             { en: "Continue creating" },
} as const satisfies Record<string, StringEntry>;

export type FunnelStringKey = keyof typeof funnelStrings;

export function t(
  key: FunnelStringKey,
  locale: Locale,
  vars?: Record<string, string | number>,
): string {
  const entry = funnelStrings[key];
  let str = locale === "ar" && entry.ar ? entry.ar : entry.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}
