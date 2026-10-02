/**
 * المحرك الإبداعي المحلي (Local Creative Engine)
 * ------------------------------------------------------------------
 * مولّد حتمي عالي الجودة يعمل بدون أي مفتاح API: يقرأ وصف المنتج،
 * يتعرّف على القطاع (عطور، قهوة، عقار…)، ثم يصوغ حزمة إعلانية
 * متكاملة من بنوك نصوص عربية مكتوبة يدويًا بمعايير الوكالات.
 *
 * الحتمية: نفس المدخلات → نفس المخرجات (بذرة هاش من المنتج + الخيارات)،
 * ما يجعل النتائج مستقرة وقابلة لاختبارات A/B.
 */

import {
  PLATFORM_META,
  type AdPack,
  type GenerateInput,
  type GoalId,
  type ToneId,
} from "./types";

/* --------------------------------- أدوات --------------------------------- */

function hashSeed(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = (h * 33) ^ text.charCodeAt(i);
  }
  return Math.abs(h >>> 0);
}

/** اختيار حتمي من مصفوفة اعتمادًا على البذرة + إزاحة */
function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset * 7) % arr.length];
}

/** خلط حتمي للمصفوفة */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function short(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** أول جملة من نص — تُستخدم كنص شاشة مكثّف */
function firstSentence(text: string, max = 42): string {
  const cut = text.split(/[.!؟؛]/)[0] ?? text;
  return short(cut.trim(), max);
}

/* ------------------------------ التعرف على القطاع ------------------------------ */

interface Vertical {
  key: string;
  match: RegExp;
  pain: string;
  solution: (p: string) => string;
  benefits: string[];
  /** مفردات بصرية للسكريبت وبرومبتات الصور */
  visualWorld: string;
  enStyle: string;
  heroVisual: string;
  socialProof: string;
}

const VERTICALS: Vertical[] = [
  {
    key: "beauty",
    match: /(عطر|عطور|بشرة|بشره|كريم|سيروم|مكياج|شعر|صابون|لوشن|مسك|عود|كحل)/,
    pain: "بشرتك تستاهل أكثر من منتجات «واحد يناسب الكل». التعب والشحوب، والتفاصيل الصغيرة التي تسرق الإشراقة يومًا بعد يوم، بينما المرآة لا ترحم.",
    solution: (p) =>
      `وهنا يأتي ${p}. تركيبة صُمّمت لتعمل معك لا عليك: مكوّنات نظيفة بتركيز مدروس، ملمس يذوب في ثوانٍ، ونتيجة تبدأ من الأسبوع الأول وتلمع في الثاني.`,
    benefits: [
      "نتيجة ملحوظة خلال 7–14 يومًا",
      "مكوّنات نظيفة وآمنة حتى للبشرة الحساسة",
      "تغليف أنيق يليق بك وبمن تهديه",
    ],
    visualWorld: "قطرات سيروم تنساب ببطء، لقطة ماكرو للملمس، انعكاس زجاجي فاخر",
    enStyle:
      "glossy serum texture, macro beauty photography, dewy skin, soft cream backdrop, luxury cosmetic ad",
    heroVisual: "زجاجة المنتج تلمع تحت ضوء صباحي ناعم على خلفية كريمية دافئة",
    socialProof: "أكثر من 12,000 عميلة جددت قنينتها الثانية",
  },
  {
    key: "food",
    match: /(قهوة|قهوه|مطعم|برجر|حلا|حلويات|كيك|شاي|مخبز|كوفي|كافيه|عصير|شوكولات|سينابون|مأكولات|بيتزا)/,
    pain: "مللتَ من «نفس الطعم»؟ الوعود كثيرة، والصور أجمل من الواقع، والنكهة الحقيقية التي تغيّر مزاج يومك كاملاً صارت عملة نادرة.",
    solution: (p) =>
      `${p} وُلد من هوس بالتفاصيل: مكوّنات تُنتقى كل صباح، تحميص وتحضير بأيدي ناس يدركون أن الطعم موقف. من أول رشفة/قضمة ستعرف الفرق دون أن نخبرك.`,
    benefits: [
      "مكوّنات طازجة تُحضَّر يوميًا",
      "طعم ثابت في كل زيارة — بلا مفاجآت",
      "توصيل سريع يصل والحرارة محفوظة",
    ],
    visualWorld: "بخار يتصاعد، كسر شوكولاتة بطيء الحركة، سكب لزج لامع، قطرات تكثّف على كوب",
    enStyle:
      "appetizing food photography, slow-motion cheese pull, steam rising, warm natural light, editorial cafe style",
    heroVisual: "لقطة مقرّبة للمنتج والبخار يرقص فوقه بإضاءة ذهبية",
    socialProof: "تقييم 4.9 من أكثر من 3,400 طلب",
  },
  {
    key: "fashion",
    match: /(ملابس|عباية|عبايه|فستان|ساعة|ساعه|نظارة|نظاره|حذاء|أحذية|شنطة|شنط|إكسسوار|اكسسوار|خاتم|مجوهرات|ثوب|طرحة)/,
    pain: "خزانتك ممتلئة، ومع ذلك: «ما عندي شيء ألبسه». قطع تفقد روحها بعد أول غسلة، وقصّات تبدو جميلة على الشاشة فقط.",
    solution: (p) =>
      `${p} يعيد تعريف القطعة التي تستحق: قصّة مدروسة على أجساد حقيقية، قماش يعيش معك سنوات لا أسابيع، وتفاصيل صغيرة تُكمل حضورك بدل أن تنافسه.`,
    benefits: [
      "خامات ممتازة تدوم وتثبت مع الغسيل",
      "قصّات مدروسة لمختلف القوامات",
      "تفاصيل فاخرة تُلاحَظ ولا تُصرّح عن نفسها",
    ],
    visualWorld: "قماش يتحرك مع الهواء، لقطة تفاصيل خياطة دقيقة، انعكاس مرآة سينمائي",
    enStyle:
      "high-fashion editorial, flowing fabric in motion, minimalist studio, elegant arabian aesthetic, vogue-style lighting",
    heroVisual: "القطعة معلّقة بإضاءة درامية جانبية وظل ناعم متدرج",
    socialProof: "نفدت التشكيلة الأولى خلال 48 ساعة",
  },
  {
    key: "tech",
    match: /(تطبيق|منصة|منصه|موقع|برنامج|نظام|ذكاء اصطناعي|أداة|اداة|saas|متجر إلكتروني|اشتراك)/i,
    pain: "وقتك أغلى من أن يضيع في مهام متكررة. تتنقل بين خمس أدوات لتنجز مهمة واحدة، والإنتاجية وعدت طويلاً… وتأخرت أطول.",
    solution: (p) =>
      `${p} يجمع كل شيء في مكان واحد يفهمك: واجهة تشتغل بسرعة تفكيرك، أتمتة تنجز عنك المهمات المملّة، ونتائج تظهر في لوحتك من أول أسبوع.`,
    benefits: [
      "إعداد كامل خلال أقل من 10 دقائق",
      "أتمتة توفر ساعات من أسبوعك",
      "دعم عربي يرد خلال دقائق لا أيام",
    ],
    visualWorld: "واجهة التطبيق تطفو بزجاجية شفافة فوق خلفية دافئة، عناصر UI تتحرك بسلاسة",
    enStyle:
      "sleek 3d app interface mockup floating, soft glassmorphism, warm studio gradient, product ui showcase, octane render",
    heroVisual: "شاشة التطبيق تلمع فوق منصة زجاجية بظل ناعم طويل",
    socialProof: "ينضم إلينا أكثر من 500 مستخدم جديد أسبوعيًا",
  },
  {
    key: "realestate",
    match: /(عقار|عقارات|شقة|شقه|فيلا|فله|أرض|ارض|سكن|مشروع سكني|استثمار عقاري|مكتب عقاري)/,
    pain: "السوق مليء بعروض «ذهبية» مشكوك فيها. موقع يخدعك في الصور، سعر يتضخم عند التوقيع، وتشطيب يتنكر لصور الكتيب.",
    solution: (p) =>
      `${p} يختصر الطريق من البحث إلى المفتاح: مواقع مختارة بمعايير استثمارية صارمة، أسعار شفافة بلا رسوم مخفية، وتسليم كما وُعد تمامًا.`,
    benefits: [
      "مواقع مختارة بدراسة نمو حقيقية",
      "شفافية كاملة: لا رسوم مخفية أبدًا",
      "مرافقة قانونية من المعاينة حتى الإفراغ",
    ],
    visualWorld: "درون يحلق فوق المشروع وقت الغروب، مخطط ثلاثي الأبعاد يضيء، مفتاح يُسلَّم",
    enStyle:
      "aerial drone shot of modern residential project at golden hour, architectural visualization, premium real estate ad",
    heroVisual: "واجهة المشروع الزجاجية تعكس شمس الغروب الدافئة",
    socialProof: "تم تسليم 340 وحدة قبل موعدها",
  },
  {
    key: "education",
    match: /(دورة|دوره|كورس|تدريب|تعلم|تعليم|لغة|لغه|جامعة|مدرسة|مهارة|شهادة|بودكاست تعليمي)/,
    pain: "كم دورة سجّلت فيها ولم تكملها؟ محتوى نظري يُملّ، ومدرب يقرأ من الشرائح، ونتيجة تتأخر حتى يغادر الحماس من الباب.",
    solution: (p) =>
      `${p} مبني على فلسفة واحدة: التطبيق من أول جلسة. منهج عملي بمشاريع حقيقية، متابعة فردية لا تتركك منتصف الطريق، ومهارة تتحول إلى دخل أو ترقية.`,
    benefits: [
      "مشاريع تطبيقية تبني ملف أعمالك",
      "متابعة ومُراجعة فردية لكل متدرب",
      "شهادة معتمدة تعزز ملفك المهني",
    ],
    visualWorld: "متدرب يعمل على لابتوب بتركيز، لقطة قبل/بعد للمهارة، سبورة أفكار مليئة",
    enStyle:
      "cinematic shot of focused student, warm study atmosphere, knowledge transformation concept, documentary style",
    heroVisual: "لحظة إنجاز حقيقية: شاشة تعرض نتيجة المتدرب وابتسامة عفوية",
    socialProof: "92% من الخريجين أكملوا حتى النهاية",
  },
  {
    key: "fitness",
    match: /(جيم|لياقة|لياقه|رياضة|رياضه|دايت|صحة|صحه|مكمل|بروتين|تخسيس|يوغا|مدرب شخصي)/,
    pain: "البدايات سهلة… الاستمرار هو المعركة الحقيقية. حماس أسبوع، اشتراك شهر، ثم عودة هادئة إلى النقطة صفر مع شعور مألوف بالذنب.",
    solution: (p) =>
      `${p} صُمم ليعمل مع نظام حياتك لا ضده: خطة مرنة تتنفس مع انشغالك، نتائج تُقاس بالمرآة لا بالوعود، ودعم يمسك يدك في أيام الفتور.`,
    benefits: [
      "خطة مرنة تناسب جدولك مهما ضاق",
      "نتائج ملموسة خلال الأسابيع الأربعة الأولى",
      "مجتمع داعم يحاسبك بلطف",
    ],
    visualWorld: "عرق يلمع بضوء سينمائي، تمرين بالحركة البطيئة، قياس تقدم أمام المرآة",
    enStyle:
      "dramatic fitness photography, cinematic sweat and determination, moody gym lighting, transformation story",
    heroVisual: "لقطة عزيمة: عقد حبل المعركة وضوء جانبي يقسم الإطار",
    socialProof: "متوسط نتائج مشتركينا: -6 كجم في 8 أسابيع",
  },
  {
    key: "general",
    match: /.*/,
    pain: "وسط زحام الخيارات، صار التميّز الحقيقي عملة نادرة: جودة تدوم، سعر عادل بلا نجومية، وتجربة تحترم وقتك وذكاءك.",
    solution: (p) =>
      `${p} وُجد ليثبت أن الثلاثة ممكنة معًا: تفاصيل مدروسة بعناية حرفي، وعد واضح بلا بنود صغيرة، ونتيجة تتكلم عن نفسها نيابة عنا.`,
    benefits: [
      "جودة تدوم وتستحق كل ريال",
      "تجربة سلسة من أول نقرة حتى الاستلام",
      "دعم يعاملك كأنك العميل الوحيد",
    ],
    visualWorld: "لقطة بطل سينمائية للمنتج، إضاءة استوديو دافئة، ظلال ناعمة",
    enStyle:
      "premium commercial product photography, warm studio lighting, minimalist cream backdrop, editorial advertising style",
    heroVisual: "المنتج في المنتصف على منصة بإضاءة سينمائية دائرية",
    socialProof: "آلاف العملاء السعداء وقياس رضا 4.8/5",
  },
];

function detectVertical(product: string): Vertical {
  return VERTICALS.find((v) => v.match.test(product)) ?? VERTICALS[VERTICALS.length - 1];
}

/* ------------------------------ بنوك الخطافات (Hooks) ------------------------------ */

interface Ctx {
  p: string; // المنتج (مختصر)
  a: string; // الجمهور
}

const HOOK_BANKS: Record<ToneId, (ctx: Ctx) => string[]> = {
  energetic: ({ p, a }) => [
    `توقّف عن التمرير — ${p} الذي يبحث عنه الجميع وصل أخيرًا`,
    `${p}: النتيجة تظهر من أول تجربة، وإلا فأنت لم تجرّبه بعد`,
    `٣٠ ثانية فقط، وستفهم لماذا يتكلم الجميع عن ${p}`,
    `إذا كنت من ${a}، فهذه أهم ١٥ ثانية في يومك`,
  ],
  luxury: ({ p }) => [
    `ليست لكل الناس. ${p} — لمن يعرف قيمة التفاصيل`,
    `${p}. حيث يلتقي الإتقان بالذوق الرفيع`,
    `بعض الاختيارات تُصنع لتبقى. ${p} واحدٌ منها`,
    `حين يتحوّل الاقتناء إلى تجربة: ${p}`,
  ],
  playful: ({ p, a }) => [
    `كنّا نخبّيه عنكم… لكن ${p} ما عاد يحتمل السرية`,
    `تحذير: ${p} قد يسبّب إدمانًا شديدًا (وسعادة أشد)`,
    `قالوا «مستحيل يعجبك كل شيء»… فردّ عليهم ${p}`,
    `رسالة إلى ${a}: وجدنا الشيء الذي كنتم تدورون حوله`,
  ],
  fomo: ({ p }) => [
    `الكمية تُنهي قبل أن تُنهي القراءة: ${p} بالكاد متبقٍ`,
    `أمس قالوا «بفكّر». اليوم يقولون «خلص». لا تكن القصة التالية`,
    `عرض ${p} يختفي مع نهاية اليوم — ولن يتكرر بهذا السعر`,
    `من انتظر ندم. ${p} بخصم محدود والعدّاد يعمل الآن`,
  ],
  local: ({ p, a }) => [
    `يا هلا! ${p} اللي الكل يسأل عنه… حَصل وين؟`,
    `صدقني، ${p} هذا غيييير عن كل اللي جربته قبل`,
    `ودك بشيء يستاهل فلوسك؟ جرّب ${p} وردّ سلّم علينا`,
    `أنت يا ${a} — هذا الإعلان مكتوب لك أنت بالاسم`,
  ],
};

/* ------------------------------ افتتاحيات النبرة ------------------------------ */

const TONE_OPENERS: Record<ToneId, string> = {
  energetic: "الحقيقة باختصار، وبلا مقدمات:",
  luxury: "للذوّاقة فقط.",
  playful: "صار وقت نحكي بصراحة (وابتسامة):",
  fomo: "انتبه — هذا آخر تنبيهٍ لطيف:",
  local: "بلا فلسفة زايدة، خلّني أقولك:",
};

const TONE_CLOSERS: Record<ToneId, Record<GoalId, string>> = {
  energetic: {
    conversion: "السعر الحالي لفترة محدودة — اطلبه الآن قبل أن يتغير، وخلي التوصيل علينا.",
    awareness: "تذكّر هذا الاسم جيدًا، لأنك ستسمعه كثيرًا في الأيام القادمة.",
    engagement: "جرّبت شيئًا مشابهًا؟ احكِ لنا تجربتك بالتعليقات — أصدق قصة ستكون بطلة إعلاننا القادم.",
    leads: "اترك بياناتك الآن، وفريقنا يتواصل معك خلال ٢٤ ساعة بعرض مصمم لك أنت.",
  },
  luxury: {
    conversion: "الكمية محدودة بطبيعتها. احجز نسختك بهدوء، فالندرة لا تحتاج إعلانًا مرتفع الصوت.",
    awareness: "بعض العلامات تُذكر. وأخرى تُروى. اختر في أي القصص تريد أن تكون.",
    engagement: "نقرأ كل رأي بعناية. شاركنا: ما التفصيلة التي لا تقبل فيها المساومة؟",
    leads: "اترك وسيلة التواصل المناسبة، وسيصلك دعوة خاصة بتجربة مخصصة.",
  },
  playful: {
    conversion: "اطلبه الآن، وإذا ما عجبك… (لن يحدث، لكننا ملزمون قانونيًا بإكمال الجملة).",
    awareness: "احفظ الاسم من الآن، حتى إذا صار ترند تقول: أنا عرفته قبلكم.",
    engagement: "منشن شخص يحتاج هذا في حياته أكثر منك — أو اعترف أنك أنت هذا الشخص.",
    leads: "سجّل بياناتك — نعدك ألا نرسل إلا ما يستحق الفتح (قسمًا غير قابل للنقض).",
  },
  fomo: {
    conversion: "عند انتهاء العداد ينتهي السعر معه. القرار قرارك، لكن الندم ليس من نصيبنا.",
    awareness: "خلال أشهر سيتحدث الجميع عنه. الفرق الوحيد: هل كنت هناك قبلهم أم بعدهم؟",
    engagement: "علّق بكلمة «أنا» خلال ساعة، وأرسل لك كود خصمك الخاص قبل انتهاء اليوم.",
    leads: "المقاعد في الدفعة الحالية أوشكت على الاكتمال — سجّل بياناتك لتحجز مكانك الآن.",
  },
  local: {
    conversion: "خلاص، الكلام وصل. اطلبه الحين والتوصيل يوصلك لين الباب.",
    awareness: "من صدق؟ جرّبه مرة وحدة، وبعدها بتحكي عنه في كل مجلس.",
    engagement: "قول لنا بالتعليقات: وش أكثر شيء عجبك؟ كلامك يوصل ونقرأه كلّه.",
    leads: "عبّ بياناتك (ما تاخذ دقيقة)، وبنكلمك ونقولك وش يناسبك بالضبط.",
  },
};

/* ------------------------------ الدعوة لاتخاذ إجراء ------------------------------ */

const CTA_BANKS: Record<GoalId, Record<ToneId, string>> = {
  conversion: {
    energetic: "اطلب الآن — الشحن مجاني لفترة محدودة",
    luxury: "اكتشف المجموعة كاملة قبل اكتمال العدد",
    playful: "اطلبه الحين… وبعدها امسح الرسالة دي من راسك",
    fomo: "اضغط الآن قبل نفاد الكمية — العداد يعمل",
    local: "يا طويل العمر اطلبه الحين، وتستاهل كل خير",
  },
  awareness: {
    energetic: "اكتشف القصة كاملة — تستاهل دقيقة من وقتك",
    luxury: "تعرّف على عالمنا بهدوء",
    playful: "تعال شوف وش السالفة (وعد: ما بنطوّل)",
    fomo: "شاهد ما سيتحدث عنه الجميع غدًا — اليوم",
    local: "تفضّل، القصة هنا من أولها",
  },
  engagement: {
    energetic: "شاركنا رأيك بالتعليقات وانقل المقطع لمن يحتاجه",
    luxury: "نُصغي لآرائكم — شاركونا التجربة",
    playful: "علّق بأغرب تجربة لك، والأغرب يفوز",
    fomo: "علّق بـ«أنا» الآن ليصلك العرض الخاص",
    local: "وش رأيك؟ كتب لنا تحت ولا تقصّر",
  },
  leads: {
    energetic: "سجّل بياناتك خلال ٢٠ ثانية واحصل على استشارتك المجانية",
    luxury: "اطلب استشارتك الخاصة — بلا التزام",
    playful: "املا الفورم (أقصر من انتظار المندوب)",
    fomo: "احجز مقعدك قبل اكتمال الدفعة الحالية",
    local: "حط رقمك وبنكلمك بكرة قبل الظهر",
  },
};

const CTA_PSYCHOLOGY: Record<GoalId, string> = {
  conversion:
    "يبني القرار على مبدأي الندرة والمكسب الفوري: ربط الطلب بقيمة لحظية (شحن مجاني/سعر مؤقت) يقلّل كلفة التردد ويحوّل النية إلى فعل قبل أن يبرد الحماس.",
  awareness:
    "يفتح «حلقة فضول» بدل البيع المباشر؛ الدعوة لاكتشاف القصة تبني ارتباطًا عاطفيًا يجعل استدعاء العلامة في لحظة الشراء شبة تلقائي.",
  engagement:
    "يطلب فعلًا صغيرًا بلا كلفة (تعليق)؛ فينشط مبدأ الالتزام والاتساق — من يتفاعل اليوم يقترب نفسيًا من الشراء غدًا، وتشتعل الخوارزمية بالتزامن.",
  leads:
    "يستثمر مبدأ المعاملة بالمثل: قيمة مجانية صادقة (استشارة/خصم) مقابل البيانات، ما يزيل حاجز الخوف من التزام غير محسوب ويرفع جودة العميل المحتمل.",
};

/* ------------------------------ أصوات التعليق حسب النبرة ------------------------------ */

const VOICE_STYLE: Record<ToneId, string> = {
  energetic: "تعليق صوتي سريع واثق بإيقاع صاعد",
  luxury: "تعليق هادئ رزين بنبرة منخفضة ووقفات مقصودة",
  playful: "تعليق خفيف بابتسامة مسموعة ووقفات كوميدية",
  fomo: "إيقاع متوتر يتسارع تدريجيًا مع نبضات عدّاد",
  local: "تعليق دارج بلهجة قريبة ودودة كأنه صديق يكلّمك",
};

/* --------------------------------- التوليد --------------------------------- */

export function generateLocalPack(input: GenerateInput): AdPack {
  const product = input.product.replace(/\s+/g, " ").trim();
  const p = short(product, 48);
  const a = input.audience?.trim() ? short(input.audience.trim(), 30) : "جمهورك المثالي";
  const v = detectVertical(product);
  const platform = PLATFORM_META[input.platform];
  const seed = hashSeed(`${product}|${input.platform}|${input.tone}|${input.goal}|${a}`);
  const ctx: Ctx = { p, a };

  /* ---------- 1) ثلاثة خطافات لاختبارات A/B ---------- */
  const hooks = seededShuffle(HOOK_BANKS[input.tone](ctx), seed).slice(0, 3);

  /* ---------- 2) النص الإعلاني الرئيسي ---------- */
  const bullets = v.benefits.map((b) => `• ${b}`).join("\n");
  const proof = `${v.socialProof} — والقائمة تطول كل يوم.`;
  const primaryText = [
    hooks[1],
    "",
    `${TONE_OPENERS[input.tone]} ${v.pain}`,
    "",
    v.solution(p),
    "",
    bullets,
    "",
    proof,
    "",
    TONE_CLOSERS[input.tone][input.goal],
  ].join("\n");

  /* ---------- 3) CTA + التأثير النفسي ---------- */
  const cta = CTA_BANKS[input.goal][input.tone];
  const ctaPsychology = CTA_PSYCHOLOGY[input.goal];

  /* ---------- 4) سكريبت الفيديو مشهدًا بمشهد ---------- */
  const isGoogle = input.platform === "google";
  const duration = isGoogle ? "15 ثانية (نسخة قابلة للتخطي)" : "15–20 ثانية";
  const aspect = isGoogle ? "16:9 / 1:1" : "9:16 عمودي";

  const scenes = [
    {
      time: "0–2s",
      title: "الخطّاف — إيقاف الإبهام",
      visual: `قطع سريع (Whip Cut) على أقرب لقطة للمنتج، اهتزازة كاميرا خفيفة، ثم تثبيت مفاجئ على ${v.heroVisual}.`,
      audio: `أول نغمة من ترند صوتي صاعد + ضربة إيقاع (Beat Hit) عند الثانية الأولى. ${VOICE_STYLE[input.tone]} يقرأ الخطاف.`,
      onScreen: hooks[0],
    },
    {
      time: "2–5s",
      title: "الألم — مرآة المشاهد",
      visual: `لقطة POV من عين العميل وهو يعيش المشكلة بإضاءة باهتة وإيقاع بطيء متعمد.`,
      audio: "خفض الموسيقى للنصف، صوت محيطي واقعي، تنهيدة خفيفة قريبة من المايك.",
      onScreen: firstSentence(v.pain),
    },
    {
      time: "5–10s",
      title: "الكشف — لحظة الحل",
      visual: `ترانزيشن سحب سريع للأعلى يكشف ${p} بإضاءة سينمائية بزاوية 45 درجة، تتبعه 3 لقطات ماكرو: ${v.visualWorld}.`,
      audio: `Beat Drop كامل مع دخول ${VOICE_STYLE[input.tone]} يشرح الحل بجملتين قصيرتين.`,
      onScreen: firstSentence(v.solution(p), 48),
    },
    {
      time: "10–15s",
      title: "البرهان — لماذا نصدّقك؟",
      visual: "مونتاج سريع: استخدام حقيقي، تفصيلة جودة قريبة، نتيجة قبل/بعد، ثم لقطة شعار.",
      audio: `الموسيقى تستمر بثبات + ${VOICE_STYLE[input.tone]} يذكر الدليل الاجتماعي.`,
      onScreen: `${v.benefits[0]} — ${v.socialProof}`,
    },
    {
      time: "15–20s",
      title: "الإغلاق — الدعوة للفعل",
      visual: `كادر ثابت نظيف للمنتج مع ${isGoogle ? "شريط بحث يكتب اسم العلامة" : "ملصق عدّاد تنازلي (Countdown Sticker) وسهم يشير لموضع الزر"}.`,
      audio: `إيقاع أخير حاسم + ${VOICE_STYLE[input.tone]} يلقي الـ CTA بجملة واحدة فقط.`,
      onScreen: cta,
    },
  ];

  const videoScript = {
    title: `سكريبت ${platform.short} — «من إيقاف الإبهام إلى إقناع القلب»`,
    duration,
    aspect,
    scenes,
  };

  /* ---------- 5) برومبتات الصور ---------- */
  const imagePrompts = [
    {
      label: "لقطة البطل (Hero Shot)",
      useCase: isGoogle ? "إعلان شبكة Google الصورية — 1:1" : "غلاف الريلز/التيك توك — 4:5",
      prompt: `Ultra-premium commercial photograph of ${short(product, 90)}, ${v.enStyle}, centered composition on a warm cream studio backdrop, soft diffused morning light, 85mm lens f/1.8, shallow depth of field, subtle glass reflections, generous negative space at top for Arabic headline, editorial advertising quality, 4k --ar ${isGoogle ? "1:1" : "4:5"} --style raw`,
    },
    {
      label: "مشهد نمط الحياة (Lifestyle)",
      useCase: "الشريحة الثانية في الكاروسيل أو منتصف الفيديو — 9:16",
      prompt: `Candid lifestyle photograph featuring ${short(product, 90)} in an authentic arabian daily moment, ${v.enStyle}, golden hour glow, natural skin tones, soft film grain, documentary advertising style, genuine emotion, tasteful composition with breathing room --ar 9:16 --style raw`,
    },
    {
      label: "بوستر جرافيكي (Ad Poster)",
      useCase: "الستوري والبنر الإعلاني مع مساحة للنص العربي — 9:16 / 1:1",
      prompt: `Bold minimalist advertising poster of ${short(product, 90)}, ${v.enStyle}, large clean empty area reserved for Arabic typography, warm coral and cream palette with one deep accent color, premium swiss-inspired grid, soft long shadows, studio product render, subtle paper grain texture --ar 9:16 --style raw`,
    },
  ];

  return {
    hooks,
    primaryText,
    cta,
    ctaPsychology,
    videoScript,
    imagePrompts,
  };
}
