"use client";
import { useState } from "react";
import type { Workspace } from "@/lib/workbench";
import { energy, foods, foodEnergy, type Profile } from "@/lib/nutrition";
type Props = {
  w: Workspace;
  today: string;
  busy: boolean;
  save: (w: Workspace, message?: string) => Promise<boolean>;
};
export default function NutritionPanel({ w, today, busy, save }: Props) {
  const nutrition = w.nutrition ?? { diary: [] };
  const p = nutrition.profile;
  const calculated = p ? energy(p) : null;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("168878");
  const [grams, setGrams] = useState("100");
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [date, setDate] = useState(today);
  const food = foods.find((f) => String(f.id) === selected);
  const per100 = food?.kcal ?? Number(customKcal);
  const name = food?.name ?? customName.trim();
  const valid =
    !!name &&
    Number(grams) > 0 &&
    Number(grams) <= 10000 &&
    Number.isFinite(per100) &&
    per100 >= 0 &&
    per100 <= 1000 &&
    (food || customKcal !== "");
  const entries = nutrition.diary.filter((d) => d.date === date);
  const total = entries.reduce((s, d) => s + foodEnergy(d.grams, d.per100), 0);
  return (
    <section className="panel study-panel">
      <p className="eyebrow">DAILY ENERGY</p>
      <h2>吃得明白 · 热量与饮食</h2>
      <p className="muted">
        先估算，再用连续 2–3
        周的体重趋势校准。每日记录只表示已记下的食物，漏记会低估摄入。
      </p>
      <details open={!p}>
        <summary>
          个人参数与热量目标{p ? "（点击调整）" : "（请先填写）"}
        </summary>
        <form
          className="nutrition-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const profile = {
              age: Number(data.get("age")),
              height: Number(data.get("height")),
              weight: Number(data.get("weight")),
              sex: data.get("sex"),
              activity: Number(data.get("activity")),
              deficit: Number(data.get("deficit")),
            } as NonNullable<Profile>;
            await save({ ...w, nutrition: { ...nutrition, profile } });
          }}
        >
          <label>
            年龄
            <input
              name="age"
              type="number"
              min="18"
              max="100"
              required
              defaultValue={p?.age}
            />
          </label>
          <label>
            身高（cm）
            <input
              name="height"
              type="number"
              min="100"
              max="230"
              step="0.1"
              required
              defaultValue={p?.height}
            />
          </label>
          <label>
            计算用体重（kg）
            <input
              name="weight"
              type="number"
              min="30"
              max="400"
              step="0.1"
              required
              defaultValue={p?.weight ?? w.settings.baseline ?? ""}
            />
          </label>
          <label>
            公式使用的生理性别
            <select name="sex" defaultValue={p?.sex ?? "male"}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>
          <label>
            活动量（估计系数）
            <select name="activity" defaultValue={p?.activity ?? 1.55}>
              <option value="1.2">久坐 · 1.2</option>
              <option value="1.375">轻度活动 · 1.375</option>
              <option value="1.55">中等活动 · 1.55</option>
              <option value="1.725">较高活动 · 1.725</option>
            </select>
          </label>
          <label>
            每日计划缺口
            <select name="deficit" defaultValue={p?.deficit ?? 500}>
              <option value="0">维持体重</option>
              <option value="300">温和 · 300 kcal</option>
              <option value="500">适度 · 500 kcal</option>
            </select>
          </label>
          <button className="primary" disabled={busy}>
            保存热量参数
          </button>
        </form>
        <p className="muted">
          经常走动不一定等于较高活动量；中等活动可暂作起点。计算用体重不会伪装成实测记录，也不会自动跟随称重改变。旅行期间可选维持体重。
        </p>
      </details>
      {calculated && (
        <div className="nutrition-stats">
          <div>
            静息代谢<strong>{Math.round(calculated.resting)} kcal</strong>
          </div>
          <div>
            估计维持摄入
            <strong>{Math.round(calculated.maintenance)} kcal</strong>
          </div>
          <div>
            起始每日目标
            <strong>{Math.round(calculated.target / 50) * 50} kcal</strong>
          </div>
        </div>
      )}
      <p className="muted">
        采用{" "}
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
          target="_blank"
          rel="noreferrer"
        >
          Mifflin–St Jeor 公式
        </a>
        与活动系数粗估，不是精确测量。适用于一般成年人；疾病、用药或特殊营养需要应先与医生/营养师确认。不会为了截止日期推荐脱水或极端节食。
      </p>
      <hr />
      <h3>食物热量速查</h3>
      <p>
        按可食部分称重，生米与熟饭分开选。包装食品优先照标签；标签为 kJ
        时，先除以 4.184 换算 kcal。
      </p>
      <div className="nutrition-form">
        <label>
          搜索参考食物
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="米饭、鸡蛋、鸡胸肉…"
          />
        </label>
        <label>
          选择食物
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="custom">自定义 / 包装标签</option>
            {foods
              .filter(
                (f) => f.name.includes(query) || String(f.id) === selected,
              )
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </label>
        {!food && (
          <>
            <label>
              食物名称
              <input
                value={customName}
                maxLength={100}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </label>
            <label>
              每 100 g 热量（kcal）
              <input
                type="number"
                min="0"
                max="1000"
                value={customKcal}
                onChange={(e) => setCustomKcal(e.target.value)}
              />
            </label>
          </>
        )}
        <label>
          份量（g）
          <input
            type="number"
            min="1"
            max="10000"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </label>
        <label>
          记录日期
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <div className="nutrition-result">
        <strong>
          {valid ? Math.round(foodEnergy(Number(grams), per100)) : "—"} kcal
        </strong>
        <span>{food ? `${food.kcal} kcal / 100 g` : "按输入的标签计算"}</span>
        <button
          className="primary"
          disabled={busy || !valid || !date || nutrition.diary.length >= 3000}
          onClick={() =>
            save(
              {
                ...w,
                nutrition: {
                  ...nutrition,
                  diary: [
                    ...nutrition.diary,
                    {
                      id: crypto.randomUUID(),
                      date,
                      name,
                      grams: Number(grams),
                      per100,
                    },
                  ],
                },
              },
              "已加入饮食记录",
            )
          }
        >
          记入这一天
        </button>
      </div>
      {food && (
        <p className="muted">
          参考：
          <a
            href={`https://fdc.nal.usda.gov/food-details/${food.id}/nutrients`}
            target="_blank"
            rel="noreferrer"
          >
            USDA FoodData Central
          </a>
          。品牌、油和酱汁会改变热量；这里只按克计算，毫升标签请先换成同一质量单位。卤味、外卖请按配方或商家标签自定义，避免把估计当精确值。
        </p>
      )}
      <h3>
        {date || "所选日期"} · 已记录 {Math.round(total)} kcal
      </h3>
      {calculated && (
        <p>
          距起始目标约{" "}
          {Math.round(calculated.target / 50) * 50 - Math.round(total)}{" "}
          kcal（负数表示记录值超过目标，不需要次日挨饿补偿）。
        </p>
      )}
      {entries.length === 0 ? (
        <p className="muted">这一天还没有饮食记录。</p>
      ) : (
        entries.map((d) => (
          <div className="nutrition-entry" key={d.id}>
            <span>
              {d.name} · {d.grams} g
            </span>
            <strong>{Math.round(foodEnergy(d.grams, d.per100))} kcal</strong>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                save({
                  ...w,
                  nutrition: {
                    ...nutrition,
                    diary: nutrition.diary.filter((x) => x.id !== d.id),
                  },
                })
              }
            >
              删除
            </button>
          </div>
        ))
      )}
    </section>
  );
}
