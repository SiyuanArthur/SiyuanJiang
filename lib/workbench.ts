import { z } from "zod";

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const [year, month, day] = v.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, "日期无效");
const text = z.string().max(10000);
export const trackSchema = z.enum([
  "career",
  "health",
  "invest",
  "english",
  "life",
]);
export const taskSchema = z.object({
  id: z.string().max(100),
  title: z.string().min(1).max(200),
  track: trackSchema,
  date,
  minutes: z.number().int().min(5).max(480),
  done: z.boolean(),
  detail: text,
  proof: z.string().max(2000),
  light: z.boolean(),
});
export const workspaceSchema = z.object({
  version: z.literal(1),
  learning: z.array(z.string().max(100)).max(100).optional(),
  nutrition: z
    .object({
      profile: z
        .object({
          age: z.number().min(18).max(100),
          height: z.number().min(100).max(230),
          weight: z.number().min(30).max(400),
          sex: z.enum(["male", "female"]),
          activity: z.union([
            z.literal(1.2),
            z.literal(1.375),
            z.literal(1.55),
            z.literal(1.725),
          ]),
          deficit: z.union([z.literal(0), z.literal(300), z.literal(500)]),
        })
        .optional(),
      diary: z
        .array(
          z.object({
            id: z.string(),
            date,
            name: z.string().min(1).max(100),
            grams: z.number().positive().max(10000),
            per100: z.number().min(0).max(1000),
          }),
        )
        .max(3000),
    })
    .optional(),
  settings: z.object({
    name: z.string().min(1).max(60),
    start: date,
    end: date,
    hours: z.number().min(1).max(80),
    baseline: z.number().min(30).max(400).nullable(),
    target: z.number().min(30).max(400).nullable(),
  }),
  trips: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(100),
        start: date,
        end: date,
        tentative: z.boolean(),
        enabled: z.boolean(),
      }),
    )
    .max(30),
  tasks: z.array(taskSchema).max(1500),
  weights: z
    .array(
      z.object({
        date,
        value: z.number().min(30).max(400),
        note: z.string().max(500),
      }),
    )
    .max(1000),
  notes: z
    .array(
      z.object({
        id: z.string(),
        date,
        title: z.string().min(1).max(200),
        body: text,
        track: trackSchema,
      }),
    )
    .max(500),
  deadlines: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        due: z.string().datetime(),
        course: z.string().max(100),
        url: z.string().max(2000),
        submitted: z.boolean(),
        note: text,
      }),
    )
    .max(200),
});
export type Workspace = z.infer<typeof workspaceSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Track = z.infer<typeof trackSchema>;
export const tracks: {
  id: Track;
  name: string;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    id: "career",
    name: "生物医学算法",
    label: "CAREER",
    color: "#bccb7b",
    description: "从实验结果，到能讲清楚的项目",
  },
  {
    id: "health",
    name: "体重与生活",
    label: "WELLBEING",
    color: "#e8b89d",
    description: "看趋势，也照顾每天的状态",
  },
  {
    id: "invest",
    name: "投资实验室",
    label: "FINANCE",
    color: "#b5c6de",
    description: "学习、记录、验证自己的判断",
  },
  {
    id: "english",
    name: "英语表达",
    label: "LANGUAGE",
    color: "#c8b9d7",
    description: "把学过的英语，真正说出来",
  },
  {
    id: "life",
    name: "生活与学业",
    label: "LIFE",
    color: "#d8ccae",
    description: "给重要的小事留个位置",
  },
];
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function addDays(d: string, n: number) {
  const v = new Date(d + "T12:00:00");
  v.setDate(v.getDate() + n);
  return localDate(v);
}
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export function monday(d: string) {
  const v = new Date(d + "T12:00:00");
  return addDays(d, -((v.getDay() + 6) % 7));
}
export function tripAt(w: Workspace, d: string) {
  return w.trips.find((t) => t.enabled && t.start <= d && t.end >= d);
}
export function emptyWorkspace(): Workspace {
  const d = localDate();
  return {
    version: 1,
    settings: {
      name: "Siyuan",
      start: d,
      end: addDays(d, 84),
      hours: 15,
      baseline: null,
      target: null,
    },
    trips: [],
    tasks: [],
    weights: [],
    notes: [],
    deadlines: [],
  };
}
export const resources = [
  {
    track: "career",
    title: "PhysioNet · 心电数据与说明",
    url: "https://physionet.org/content/mitdb/1.0.0/",
  },
  {
    track: "career",
    title: "MONAI · 医学影像项目教程",
    url: "https://github.com/Project-MONAI/tutorials",
  },
  {
    track: "invest",
    title: "ASIC Moneysmart · 股票投资基础",
    url: "https://moneysmart.gov.au/shares",
  },
  {
    track: "health",
    title: "NHS · 可持续体重管理",
    url: "https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/tips-to-help-you-lose-weight/",
  },
  {
    track: "english",
    title: "British Council · 英语学习",
    url: "https://learnenglish.britishcouncil.org/",
  },
];
export function calendarFile(w: Workspace) {
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Personal Workbench//Assignments//ZH",
    ...w.deadlines
      .filter((x) => !x.submitted)
      .flatMap((x) => [
        "BEGIN:VEVENT",
        `UID:${x.id}@personal-workbench`,
        `DTSTAMP:${stamp(new Date().toISOString())}`,
        `DTSTART:${stamp(x.due)}`,
        `DTEND:${stamp(new Date(Date.parse(x.due) + 1800000).toISOString())}`,
        `SUMMARY:${escape(x.title)}`,
        `DESCRIPTION:${escape(x.course + " " + x.note + " " + x.url)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(x.title)}`,
        "END:VALARM",
        "BEGIN:VALARM",
        "TRIGGER:-PT2H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escape(x.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ]),
    "END:VCALENDAR",
  ].join("\r\n");
}
