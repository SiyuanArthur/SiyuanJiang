import type { Workspace } from "./workbench";
export type Profile = NonNullable<Workspace["nutrition"]>["profile"];
export function energy(p: NonNullable<Profile>) {
  const resting =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const maintenance = resting * p.activity;
  return { resting, maintenance, target: maintenance - p.deficit };
}
export const foodEnergy = (grams: number, per100: number) =>
  (grams * per100) / 100;
// USDA FoodData Central, SR Legacy. Values refer to 100 g edible portion.
export const foods = [
  { id: 168877, name: "白米（生重，长粒）", kcal: 365 },
  { id: 168878, name: "白米饭（熟重）", kcal: 130 },
  { id: 171477, name: "鸡胸肉（去皮，烤熟）", kcal: 165 },
  { id: 173424, name: "水煮鸡蛋（去壳）", kcal: 155 },
  { id: 173944, name: "香蕉（去皮）", kcal: 89 },
  { id: 170379, name: "西兰花（生重）", kcal: 34 },
  { id: 172475, name: "硬豆腐（硫酸钙制作）", kcal: 144 },
  { id: 171284, name: "原味全脂酸奶", kcal: 61 },
  { id: 171013, name: "米糠油", kcal: 884 },
  { id: 168914, name: "米粉（煮熟）", kcal: 108 },
];
