/** Fixed baseline for daily tracking — read the same text every day. */
export const SPEECH_BASELINE_A = {
  title: "Bazë A — ndjekje",
  hint: "Lexo ngadalë por natyrshëm, jo të tepruar.",
  body: `Sot po e lexoj këtë tekst për të vëzhguar zërin, ritmin dhe qartësinë time. Nuk kam nevojë ta bëj në mënyrë perfekte. Qëllimi është të flas me qetësi, me frymëmarrje të rregullt dhe me vëmendje të butë. Nëse një fjalë del më vështirë, vazhdoj pa u ndalur shumë. Trupi im mëson përmes përsëritjes, durimit dhe praktikës së përditshme.`,
} as const;

/** Articulation-focused baseline — Albanian sound combinations. */
export const SPEECH_BASELINE_B = {
  title: "Bazë B — artikulim",
  hint: "Ushtro rr, r, ll, l, th, dh, gj, q, ç, xh, sh, zh.",
  body: `Rruga drejt qartësisë nuk është gjithmonë e shkurtër, por çdo hap i vogël ka rëndësi. Lëvizjet e buzëve, gjuhës dhe nofullës bëhen më të sigurta kur i përsëris me qetësi. Thëniet e thjeshta, fjalët me "dh", "gj", "ç" dhe "rr", më ndihmojnë të dëgjoj më mirë zërin tim. Unë flas ngadalë, qartë dhe pa nxitim.`,
} as const;

/** Expressive / prosody baseline — optional reference in wiki. */
export const SPEECH_BASELINE_C = {
  title: "Bazë C — prozodi ekspresive",
  hint: "Ritëm natyral, melodi dhe fjalim ekspresiv.",
  body: `Në mëngjes, qyteti zgjohet ngadalë. Dritaret hapen, hapat dëgjohen në rrugë, dhe ajri mbushet me zëra të zakonshëm. Dikush nxiton për në punë, dikush pi kafe, dikush pret autobusin. Edhe unë marr pak kohë për veten: marr frymë, lexoj, dëgjoj zërin tim dhe e lë fjalën të dalë me qetësi.`,
} as const;

export type SpeechRotatingText = {
  day: number;
  theme: string;
  body: string;
};

/** One rotating Albanian text per program day (cycles 1–7). */
export const SPEECH_ROTATING_TEXTS: SpeechRotatingText[] = [
  {
    day: 1,
    theme: "Qetësi dhe kontroll",
    body: `Sot nuk po kërkoj përsosmëri. Po kërkoj prani, durim dhe vazhdimësi. Kur flas më ngadalë, dëgjoj më mirë ritmin e fjalëve. Kur marr frymë më qetë, zëri im bëhet më i qëndrueshëm. Çdo fjali është një mundësi e vogël për ta ushtruar trurin dhe trupin të punojnë së bashku.`,
  },
  {
    day: 2,
    theme: "Lëvizje dhe fjalë",
    body: `Lëvizja dhe fjala kanë diçka të përbashkët: të dyja kanë ritëm. Një hap mund të jetë i lehtë ose i rëndë; një fjalë mund të jetë e qartë ose e turbullt. Unë nuk e detyroj trupin tim. E ftoj të më ndjekë, me kujdes, me përsëritje dhe me besim.`,
  },
  {
    day: 3,
    theme: "Ushtrim tingujsh shqip",
    body: `Rrushi rritet në rrënjë të forta, ndërsa lumi lëviz ngadalë nëpër luginë. Gjethi i gjelbër dridhet në erë, qeni qëndron pranë portës, ndërsa çelësi bie mbi tavolinë. Zhurma shuhet, fjala qartësohet, dhe zëri vazhdon rrugën e vet.`,
  },
  {
    day: 4,
    theme: "Fjalim funksional ditor",
    body: `Mirëmëngjes. Sot kam disa detyra për të bërë. Do të punoj pak, do të pushoj kur të kem nevojë, dhe do të kujdesem të mos nxitoj pa arsye. Nëse lodhem, do të marr një pauzë të shkurtër. Nuk është e rëndësishme të bëj gjithçka menjëherë; është e rëndësishme të vazhdoj me rregull.`,
  },
  {
    day: 5,
    theme: "Besim",
    body: `Zëri im nuk duhet të jetë perfekt për të qenë i vlefshëm. Edhe kur ndryshon, edhe kur lodhet, edhe kur kërkon më shumë përpjekje, ai mbetet zëri im. Unë mund të flas më qartë duke ulur shpejtësinë, duke marrë frymë më mirë dhe duke i dhënë vetes kohë.`,
  },
  {
    day: 6,
    theme: "Lexim ekspresiv",
    body: `Në mbrëmje, dritat bëhen më të buta dhe zhurmat largohen pak nga pak. Njeriu e ndien ditën në trup: në shpatulla, në duar, në frymëmarrje. Atëherë është mirë të ndalesh, të dëgjosh dhe të thuash me zë të ulët: sot bëra sa munda, dhe kjo mjafton për sot.`,
  },
  {
    day: 7,
    theme: "Sfida më e gjatë",
    body: `Gjatë javës, ndryshimet e vogla shpesh nuk duken menjëherë. Por kur i regjistroj, kur i dëgjoj me qetësi dhe kur i krahasoj pas disa ditësh, mund të vërej gjëra që më parë nuk i shihja. Ndoshta ritmi është pak më i qëndrueshëm. Ndoshta disa tinguj dalin më lehtë. Ndoshta kam më shumë kontroll mbi shpejtësinë. Këto janë shenja të vogla, por të rëndësishme.`,
  },
];

/** Optional manual reference only — not scheduled in daily rotation. */
export const SPEECH_ENGLISH_BASELINE = {
  title: "English baseline",
  hint: "Optional 1–2×/week if you track work or social English speech.",
  body: `Today I am reading this text to observe my speech clearly and calmly. I do not need to force anything or sound perfect. My goal is to speak with steady breathing, natural rhythm, and relaxed attention. If a word feels difficult, I continue without judging myself. Each recording is a small piece of information, and each repetition is part of my rehabilitation.`,
} as const;

export const SPEECH_SPONTANEOUS_PROMPT =
  '"Today my speech felt…, my body felt…, and tomorrow I want to notice…"';

export type SpontaneousPromptKey = "speechFelt" | "bodyFelt" | "tomorrowNotice";

export type SpontaneousOption = {
  id: string;
  label: string;
};

export const SPEECH_SPONTANEOUS_PROMPTS: {
  key: SpontaneousPromptKey;
  lead: string;
  options: SpontaneousOption[];
}[] = [
  {
    key: "speechFelt",
    lead: "Today my speech felt…",
    options: [
      { id: "clear", label: "Clear / steady" },
      { id: "bit-unclear", label: "A bit unclear" },
      { id: "slow", label: "Slow" },
      { id: "rushed", label: "Fast / rushed" },
      { id: "tired", label: "Tired / weak" },
      { id: "strained", label: "Strained / effortful" },
      { id: "uneven", label: "Uneven" },
      { id: "better", label: "Better than yesterday" },
      { id: "same", label: "About the same" },
    ],
  },
  {
    key: "bodyFelt",
    lead: "My body felt…",
    options: [
      { id: "rested", label: "Rested / calm" },
      { id: "tired", label: "Tired" },
      { id: "tense", label: "Tense (jaw / shoulders)" },
      { id: "relaxed", label: "Relaxed" },
      { id: "heavy", label: "Heavy" },
      { id: "good-energy", label: "Light / good energy" },
      { id: "sleep-low", label: "Low sleep" },
      { id: "post-rehab", label: "Fatigued after rehab" },
    ],
  },
  {
    key: "tomorrowNotice",
    lead: "Tomorrow I want to notice…",
    options: [
      { id: "rhythm", label: "Rhythm" },
      { id: "breath", label: "Breathing" },
      { id: "pacing", label: "Pacing / speed" },
      { id: "hard-sounds", label: "Hard sounds" },
      { id: "saliva", label: "Saliva / swallow" },
      { id: "volume", label: "Volume / projection" },
      { id: "confidence", label: "Confidence" },
      { id: "fatigue-effect", label: "How fatigue affects speech" },
    ],
  },
];

const SPONTANEOUS_OPTION_IDS = new Set(
  SPEECH_SPONTANEOUS_PROMPTS.flatMap((prompt) =>
    prompt.options.map((option) => option.id),
  ),
);

export function isSpontaneousOptionId(value: string): boolean {
  return SPONTANEOUS_OPTION_IDS.has(value);
}

/** Mon, Wed, Fri — articulation baseline B. */
export const SPEECH_ARTICULATION_WEEKDAYS = [1, 3, 5] as const;
