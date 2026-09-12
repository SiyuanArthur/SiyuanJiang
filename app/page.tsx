"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Route,
  Activity,
  BookOpen,
  CalendarClock,
  FolderOpen,
  Settings2,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  Plane,
  Download,
  Upload,
  Menu,
  X,
  Leaf,
  CheckCheck,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  Workspace,
  Task,
  Track,
  tracks,
  localDate,
  addDays,
  daysBetween,
  monday,
  tripAt,
  emptyWorkspace,
  workspaceSchema,
  resources,
  calendarFile,
} from "@/lib/workbench";

type View =
  | "home"
  | "roadmap"
  | "health"
  | "journal"
  | "deadlines"
  | "files"
  | "settings";
type Legacy = {
  id: string;
  kind: string;
  title: string;
  body: string;
  date: string;
  done: number;
  count: number;
  name: string;
  size: number;
};
const nav = [
  { id: "home", label: "总览", icon: LayoutDashboard },
  { id: "roadmap", label: "目标路线", icon: Route },
  { id: "health", label: "体重记录", icon: Activity },
  { id: "journal", label: "随笔与复盘", icon: BookOpen },
  { id: "deadlines", label: "作业与截止日", icon: CalendarClock },
  { id: "files", label: "文件收藏", icon: FolderOpen },
] as const;
const uid = () => crypto.randomUUID();
const short = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
function download(name: string, body: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function Pill({ track }: { track: Track }) {
  const t = tracks.find((x) => x.id === track)!;
  return <span className={"pill " + track}>{t.name}</span>;
}

export default function Workbench() {
  const [w, setW] = useState<Workspace | null>(null),
    [legacy, setLegacy] = useState<Legacy[]>([]),
    [view, setView] = useState<View>("home"),
    [mobile, setMobile] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [today, setToday] = useState(""),
    [selected, setSelected] = useState(""),
    [week, setWeek] = useState(""),
    [track, setTrack] = useState<Track>("career"),
    [taskForm, setTaskForm] = useState<Task | null>(null);
  const [now, setNow] = useState(0);
  const revision = useRef(0),
    lock = useRef(false),
    [fresh, setFresh] = useState(false);
  async function reload() {
    setError("");
    try {
      const [r, l] = await Promise.all([
        fetch("/api/workbench"),
        fetch("/api/items"),
      ]);
      if (!r.ok) throw Error("工作台暂时无法加载，请重试。");
      const data = (await r.json()) as {
        revision: number;
        workspace: Workspace | null;
      };
      revision.current = data.revision;
      setFresh(!data.workspace);
      setW(data.workspace ?? emptyWorkspace());
      if (l.ok) setLegacy(await l.json());
      else setError("旧笔记和文件暂时未能加载，请刷新重试。");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const initial = setTimeout(() => {
      const d = localDate();
      setToday(d);
      setNow(Date.now());
      setSelected(d);
      setWeek(monday(d));
      void reload();
    }, 0);
    const timer = setInterval(() => {
      setToday(localDate());
      setNow(Date.now());
    }, 60000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);
  async function save(next: Workspace, message = "已保存到云端") {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/workbench", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: revision.current, workspace: next }),
      });
      const data = (await r.json()) as { revision: number; error?: string };
      if (!r.ok) throw Error(data.error || "保存失败");
      revision.current = data.revision;
      setW(next);
      setFresh(false);
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const go = (v: View) => {
    setView(v);
    setMobile(false);
    setNotice("");
  };
  async function importPlan(file?: File) {
    if (!file || !w) return;
    try {
      if (file.size > 1500000) throw Error("文件超过 1.5 MB");
      const imported = workspaceSchema.parse(JSON.parse(await file.text()));
      if (
        !fresh &&
        (w.tasks.length ||
          w.notes.length ||
          w.weights.length ||
          w.deadlines.length)
      ) {
        if (
          !window.confirm(
            "导入将替换工作台计划和记录（原有文件与旧笔记不变）。建议先导出备份。继续吗？",
          )
        )
          return;
      }
      await save(imported, "私人计划已导入，开始第一步吧。");
    } catch {
      setError("无法导入。请选择工作台导出的 JSON 计划文件。");
    }
  }
  async function toggle(t: Task) {
    if (!w) return;
    await save(
      {
        ...w,
        tasks: w.tasks.map((x) =>
          x.id === t.id ? { ...x, done: !x.done } : x,
        ),
      },
      t.done ? "任务已重新打开" : "完成了一步，做得好。",
    );
  }
  function newTask(t: Track = "career") {
    setTaskForm({
      id: uid(),
      title: "",
      track: t,
      date: selected || today,
      minutes: 30,
      done: false,
      detail: "",
      proof: "",
      light: false,
    });
  }
  const [noteEdit, setNoteEdit] = useState<Workspace["notes"][number] | null>(
      null,
    ),
    [deadlineEdit, setDeadlineEdit] = useState<
      Workspace["deadlines"][number] | null
    >(null),
    [journalTrack, setJournalTrack] = useState("all");
  if (loading || !w)
    return (
      <div className="loading-screen">
        <span className="brand-mark">s.</span>
        <h2>{loading ? "正在打开你的工作台" : "暂时无法连接工作台"}</h2>
        {error && <p>{error}</p>}
        <button onClick={() => void reload()}>重新连接</button>
      </div>
    );
  const trip = tripAt(w, today),
    daysLeft = daysBetween(today, w.settings.end),
    completed = w.tasks.filter((t) => t.done).length,
    percentage = w.tasks.length
      ? Math.round((completed / w.tasks.length) * 100)
      : 0;
  const weekTasks = w.tasks.filter(
      (t) => t.date >= week && t.date <= addDays(week, 6),
    ),
    weekDone = weekTasks.filter((t) => t.done).length;
  const selectedTasks = w.tasks.filter((t) => t.date === selected),
    late = w.tasks.filter((t) => !t.done && t.date < today);
  const deadlineSoon = w.deadlines
    .filter((d) => !d.submitted)
    .sort((a, b) => a.due.localeCompare(b.due));
  const weights = [...w.weights].sort((a, b) => a.date.localeCompare(b.date)),
    latest = weights.at(-1),
    recent = weights.filter(
      (x) => x.date >= addDays(today, -6) && x.date <= today,
    ),
    avg = recent.length
      ? recent.reduce((s, x) => s + x.value, 0) / recent.length
      : null;
  const titles: Record<View, string> = {
    home: "把今天，变成下一步。",
    roadmap: "目标很远，下一步很近。",
    health: "关注趋势，也照顾自己。",
    journal: "记录，让经历留下来。",
    deadlines: "把截止日，安排在心里。",
    files: "给你的成果，一个位置。",
    settings: "找到适合自己的节奏。",
  };
  const TaskRow = ({ t }: { t: Task }) => (
    <div className={"task-row " + (t.done ? "is-done" : "")}>
      <button
        className="check-box"
        aria-label={(t.done ? "重新打开 " : "完成 ") + t.title}
        disabled={busy}
        onClick={() => void toggle(t)}
      >
        {t.done && <Check size={14} />}
      </button>
      <button className="task-copy" onClick={() => setTaskForm({ ...t })}>
        <strong>{t.title}</strong>
        <span>
          <Pill track={t.track} />
          <small>
            {t.minutes} 分钟{t.light ? " · 轻量任务" : ""}
          </small>
        </span>
      </button>
      <button
        className="icon-button"
        aria-label={"编辑 " + t.title}
        onClick={() => setTaskForm({ ...t })}
      >
        <ArrowUpRight size={18} />
      </button>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <Link className="brand" href="/">
          <span className="brand-mark">s.</span>
          <span>
            SIYUAN<small>THE PERSONAL WORKSPACE</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={() => setMobile(false)}
          aria-label="关闭导航"
        >
          <X />
        </button>
        <p className="nav-caption">MY WORKSPACE</p>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "deadlines" && deadlineSoon.length > 0 && (
                <span className="nav-count">{deadlineSoon.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Leaf size={22} />
          <p>
            不用一次改变所有事。
            <br />
            今天，向前一点就好。
          </p>
          <span>SMALL STEPS, REAL CHANGE.</span>
        </div>
        <button
          className={"settings-nav " + (view === "settings" ? "active" : "")}
          onClick={() => go("settings")}
        >
          <Settings2 size={18} />
          计划设置
        </button>
        <div className="profile">
          <span>{w.settings.name.slice(0, 1)}</span>
          <div>
            {w.settings.name}
            <small>我的私人空间</small>
          </div>
          <span className="online-dot" />
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              onClick={() => setMobile(true)}
              aria-label="打开导航"
            >
              <Menu />
            </button>
            <span>我的工作台</span>
            <span className="breadcrumb">
              / {nav.find((n) => n.id === view)?.label ?? "计划设置"}
            </span>
          </div>
          <div className="topbar-right">
            <span className="save-state">
              <i />
              {busy ? "正在保存…" : "云端工作台"}
            </span>
            <time>
              {today &&
                new Date(today + "T12:00:00").toLocaleDateString("zh-CN", {
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
            </time>
          </div>
        </header>
        <main>
          <div className="heading">
            <div>
              <p className="eyebrow">A LITTLE BETTER, EVERY DAY</p>
              <h1>{titles[view]}</h1>
              <p className="subheading">
                {view === "home"
                  ? `你好，${w.settings.name}。让想做的事，都有一个落脚点。`
                  : "留出空间，专注于真正重要的事。"}
              </p>
            </div>
            <button className="primary" onClick={() => newTask()}>
              <Plus size={17} />
              添加任务
            </button>
          </div>
          {error && (
            <div role="alert" className="alert error">
              {error}
              <button onClick={() => void reload()}>
                <RefreshCw size={15} />
                刷新数据
              </button>
            </div>
          )}
          {notice && (
            <div className="toast" role="status">
              <CheckCheck size={16} />
              {notice}
              <button
                className="icon-button"
                aria-label="关闭提示"
                onClick={() => setNotice("")}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {fresh && (
            <section className="import-banner">
              <div>
                <strong>你的新工作台，准备好了。</strong>
                <p>
                  导入为你准备的私人计划，四条路线和每周任务会自动就位。原来的笔记与文件已保留。
                </p>
              </div>
              <label className="primary">
                导入私人计划
                <input
                  hidden
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    void importPlan(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </section>
          )}
          {view === "home" && (
            <>
              <section className="overview-top">
                <div className="season-card">
                  <div>
                    <span className="eyebrow">THIS CHAPTER</span>
                    <h2>
                      朝着想成为的自己，
                      <br />
                      稳稳向前。
                    </h2>
                    <p>
                      {short(w.settings.start)} — {short(w.settings.end)} ·
                      四条主线，一个日常
                    </p>
                    <button onClick={() => go("roadmap")}>
                      查看我的路线 <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="season-count">
                    <span>距离本阶段结束</span>
                    <strong>
                      {Math.max(0, daysLeft)}
                      <small>天</small>
                    </strong>
                    <div className="tiny-progress">
                      <i style={{ width: `${percentage}%` }} />
                    </div>
                    <span>
                      {completed} / {w.tasks.length} 步已完成
                    </span>
                  </div>
                  <div className="orb" />
                </div>
                <div className="week-summary">
                  <p className="eyebrow">THIS WEEK</p>
                  <h3>一点点，也算数。</h3>
                  <div className="week-numbers">
                    {weekDone}
                    <span>
                      / {weekTasks.length}
                      <small>本周已完成</small>
                    </span>
                  </div>
                  <p>
                    {Math.round(
                      (weekTasks.reduce((s, t) => s + t.minutes, 0) / 60) * 10,
                    ) / 10}{" "}
                    小时计划 · 可随时调整
                  </p>
                </div>
              </section>
              <section className="goal-grid">
                {tracks.slice(0, 4).map((t, i) => {
                  const tasks = w.tasks.filter((x) => x.track === t.id),
                    done = tasks.filter((x) => x.done).length;
                  return (
                    <button
                      className={"goal-card " + t.id}
                      key={t.id}
                      onClick={() => {
                        if (t.id === "health") go("health");
                        else {
                          setTrack(t.id);
                          go("roadmap");
                        }
                      }}
                    >
                      <div className="goal-top">
                        <span className="goal-index">0{i + 1}</span>
                        <ArrowUpRight size={18} />
                      </div>
                      <h3>{t.name}</h3>
                      <p>{t.description}</p>
                      <div className="goal-bottom">
                        <span>
                          {t.id === "health" && latest
                            ? `${latest.value.toFixed(1)} kg`
                            : done + " / " + tasks.length + " 步"}
                        </span>
                        <span>
                          {tasks.length
                            ? Math.round((done / tasks.length) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="progress">
                        <i
                          style={{
                            width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`,
                            background: t.color,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </section>
              <div className="dashboard-grid">
                <div>
                  <section className="panel">
                    <div className="panel-title">
                      <div>
                        <p className="eyebrow">WEEKLY RHYTHM</p>
                        <h2>这一周的节奏</h2>
                      </div>
                      <div className="week-controls">
                        <button
                          aria-label="上一周"
                          onClick={() => setWeek(addDays(week, -7))}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span>
                          {short(week)} – {short(addDays(week, 6))}
                        </span>
                        <button
                          aria-label="下一周"
                          onClick={() => setWeek(addDays(week, 7))}
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setWeek(monday(today));
                            setSelected(today);
                          }}
                        >
                          今天
                        </button>
                      </div>
                    </div>
                    <div className="week-strip">
                      {Array.from({ length: 7 }, (_, i) => {
                        const d = addDays(week, i),
                          ts = w.tasks.filter((t) => t.date === d);
                        return (
                          <button
                            key={d}
                            className={
                              (selected === d ? "selected " : "") +
                              (d === today ? "today" : "")
                            }
                            onClick={() => setSelected(d)}
                          >
                            <span>
                              {["一", "二", "三", "四", "五", "六", "日"][i]}
                            </span>
                            <strong>{Number(d.slice(-2))}</strong>
                            <div className="day-dots">
                              {ts.length ? (
                                <>
                                  <i
                                    className={
                                      ts.every((t) => t.done) ? "complete" : ""
                                    }
                                  />
                                  <small>{ts.length}</small>
                                </>
                              ) : (
                                <small>留白</small>
                              )}
                            </div>
                            {tripAt(w, d) && <Plane size={12} />}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <section className="panel tasks-panel">
                    <div className="panel-title">
                      <div>
                        <p className="eyebrow">ONE STEP AT A TIME</p>
                        <h2>
                          {selected === today
                            ? "今天的下一步"
                            : short(selected) + " 的任务"}{" "}
                          <span className="badge">{selectedTasks.length}</span>
                        </h2>
                      </div>
                      <button className="text-button" onClick={() => newTask()}>
                        添加 <Plus size={15} />
                      </button>
                    </div>
                    {tripAt(w, selected) && (
                      <div className="travel-inline">
                        <Plane size={16} />
                        {tripAt(w, selected)?.name} · 先做轻量任务，其余可改期
                      </div>
                    )}
                    {selectedTasks.length ? (
                      selectedTasks.map((t) => <TaskRow key={t.id} t={t} />)
                    ) : (
                      <div className="empty">
                        <Leaf />
                        <h3>今天还有留白。</h3>
                        <p>添加一个小任务，或去路线里选择下一步。</p>
                        <button onClick={() => go("roadmap")}>
                          查看目标路线 <ArrowRight size={15} />
                        </button>
                      </div>
                    )}
                  </section>
                  {late.length > 0 && (
                    <section className="panel">
                      <div className="panel-title">
                        <h2>
                          待重新安排{" "}
                          <span className="badge">{late.length}</span>
                        </h2>
                        <span className="muted">点任务可修改日期</span>
                      </div>
                      {late.slice(0, 5).map((t) => (
                        <TaskRow key={t.id} t={t} />
                      ))}
                      {late.length > 5 && (
                        <button
                          className="text-button"
                          onClick={() => go("roadmap")}
                        >
                          去路线查看其余 {late.length - 5} 项
                        </button>
                      )}
                    </section>
                  )}
                </div>
                <aside className="right-column">
                  <section className="panel deadline-preview">
                    <div className="panel-title">
                      <h2>别忘了交作业</h2>
                      <CalendarClock size={19} />
                    </div>
                    {deadlineSoon.length ? (
                      deadlineSoon.slice(0, 3).map((d) => (
                        <button
                          key={d.id}
                          className="deadline-mini"
                          onClick={() => {
                            go("deadlines");
                            setDeadlineEdit(d);
                          }}
                        >
                          <strong>{d.title}</strong>
                          <span>
                            {new Date(d.due).toLocaleString("zh-CN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <small
                            className={Date.parse(d.due) < now ? "danger" : ""}
                          >
                            {Date.parse(d.due) < now
                              ? "已逾期"
                              : `剩余 ${Math.max(1, Math.ceil((Date.parse(d.due) - now) / 86400000))} 天`}
                          </small>
                        </button>
                      ))
                    ) : (
                      <p className="muted">
                        暂时没有截止日期。提前写下来，给自己留一点余量。
                      </p>
                    )}
                    <button
                      className="text-button"
                      onClick={() => {
                        go("deadlines");
                        setDeadlineEdit({
                          id: uid(),
                          title: "",
                          due: new Date(Date.now() + 86400000).toISOString(),
                          course: "",
                          url: "",
                          submitted: false,
                          note: "",
                        });
                      }}
                    >
                      添加截止日 <Plus size={15} />
                    </button>
                  </section>
                  <section className="travel-card">
                    <Plane size={24} />
                    <p className="eyebrow">ROOM FOR LIFE</p>
                    <h3>{trip ? "正在旅途中" : "计划，也要留有余地。"}</h3>
                    <p>
                      {trip
                        ? trip.name + " · 维持节奏就是进步。"
                        : "旅行日切换轻量模式，把精力留给眼前的生活。"}
                    </p>
                    {w.trips.map((t) => (
                      <div className="trip-mini" key={t.id}>
                        <span>
                          {t.name}
                          {t.tentative ? " · 暂定" : ""}
                        </span>
                        <small>
                          {short(t.start)} — {short(t.end)}
                          {!t.enabled ? " · 未启用" : ""}
                        </small>
                      </div>
                    ))}
                    <button
                      className="text-button"
                      onClick={() => go("settings")}
                    >
                      调整旅行安排 <ArrowUpRight size={15} />
                    </button>
                  </section>
                  <button
                    className="journal-prompt"
                    onClick={() => {
                      go("journal");
                      setNoteEdit({
                        id: uid(),
                        date: today,
                        title: "今天的一点进展",
                        body: "今天完成了什么？\n\n哪里遇到困难？\n\n下一步做什么？\n",
                        track: "life",
                      });
                    }}
                  >
                    <BookOpen size={22} />
                    <strong>给今天留几句话。</strong>
                    <span>记录进展，也记录真实的感受。</span>
                    <ArrowUpRight size={18} />
                  </button>
                </aside>
              </div>
            </>
          )}
          {view === "roadmap" && (
            <>
              <div className="track-tabs">
                {tracks.map((t) => (
                  <button
                    className={track === t.id ? "active" : ""}
                    key={t.id}
                    onClick={() => setTrack(t.id)}
                  >
                    <span style={{ background: t.color }} />
                    {t.name}
                  </button>
                ))}
              </div>
              <div className="roadmap-intro">
                <div>
                  <p className="eyebrow">YOUR ROADMAP</p>
                  <h2>{tracks.find((t) => t.id === track)?.description}</h2>
                  <p>
                    {track === "career"
                      ? "项目以可复现的代码、合理的评估和清楚的讲解为完成标准。"
                      : track === "invest"
                        ? "先理解做多、做空和风险；策略模型以模拟验证为主，不自动交易。"
                        : track === "english"
                          ? "每周留下可回听的表达与可修改的文字，积累真实场景能力。"
                          : track === "health"
                            ? "体重记录与行动任务分开：数字不决定一天的价值。"
                            : "作业、生活与杂事，也值得被认真安排。"}
                  </p>
                </div>
                <button className="secondary" onClick={() => newTask(track)}>
                  <Plus size={16} />
                  添加这条路线的任务
                </button>
              </div>
              {Array.from(
                new Set(
                  w.tasks
                    .filter((t) => t.track === track)
                    .map((t) => monday(t.date)),
                ),
              )
                .sort()
                .map((wk, i) => {
                  const ts = w.tasks.filter(
                    (t) => t.track === track && monday(t.date) === wk,
                  );
                  return (
                    <section className="panel roadmap-week" key={wk}>
                      <div className="panel-title">
                        <h2>
                          <span className="week-number">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {short(wk)} — {short(addDays(wk, 6))}
                        </h2>
                        <span className="muted">
                          {ts.filter((t) => t.done).length}/{ts.length} 完成 ·{" "}
                          {ts.reduce((s, t) => s + t.minutes, 0)} 分钟
                        </span>
                      </div>
                      {ts
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((t) => (
                          <div key={t.id}>
                            <TaskRow t={t} />
                            <div className="task-detail">
                              <span>{short(t.date)}</span>
                              <p>{t.detail}</p>
                              {t.proof && (
                                <p className="proof">成果：{t.proof}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </section>
                  );
                })}
              {!w.tasks.some((t) => t.track === track) && (
                <div className="panel empty">
                  这条路线还没有任务。导入私人计划，或添加你的第一步。
                </div>
              )}
              <div className="resource-list">
                {resources
                  .filter((r) => r.track === track)
                  .map((r) => (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      key={r.url}
                    >
                      {r.title}
                      <ExternalLink size={15} />
                    </a>
                  ))}
              </div>
            </>
          )}
          {view === "health" && (
            <>
              <section className="health-grid">
                <div className="panel">
                  <p className="eyebrow">LATEST CHECK-IN</p>
                  <h2>最近一次体重</h2>
                  <div className="big-number">
                    {latest?.value.toFixed(1) ?? "—"}
                    <span>kg</span>
                  </div>
                  <p className="muted">
                    {latest
                      ? short(latest.date) + " · " + latest.note
                      : "还没有称重记录，起始估计不算实测。"}
                  </p>
                </div>
                <div className="panel">
                  <p className="eyebrow">7-DAY AVERAGE</p>
                  <h2>近 7 天均值</h2>
                  <div className="big-number">
                    {avg?.toFixed(1) ?? "—"}
                    <span>kg</span>
                  </div>
                  <p className="muted">
                    来自近 7 天 {recent.length} 次记录 · 降低单日波动干扰
                  </p>
                </div>
                <div className="panel">
                  <p className="eyebrow">PERSONAL TARGET</p>
                  <h2>你的目标</h2>
                  <div className="big-number">
                    {w.settings.target ?? "—"}
                    <span>kg</span>
                  </div>
                  <p className="muted">
                    {short(w.settings.end)} 前的个人愿望 · 可在设置中调整
                  </p>
                </div>
              </section>
              <section className="panel">
                <div className="panel-title">
                  <h2>体重趋势</h2>
                  <span className="muted">仅显示实际记录</span>
                </div>
                <WeightChart weights={weights} />
                <form
                  className="inline-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      data = new FormData(form),
                      entry = {
                        date: String(data.get("date")),
                        value: Number(data.get("weight")),
                        note: String(data.get("note")),
                      };
                    if (
                      await save(
                        {
                          ...w,
                          weights: [
                            ...w.weights.filter((x) => x.date !== entry.date),
                            entry,
                          ],
                        },
                        "体重记录已保存",
                      )
                    )
                      form.reset();
                  }}
                >
                  <label>
                    记录日期
                    <input
                      name="date"
                      type="date"
                      max={today}
                      defaultValue={today}
                      required
                    />
                  </label>
                  <label>
                    体重 / kg
                    <input
                      name="weight"
                      type="number"
                      min="30"
                      max="400"
                      step="0.1"
                      placeholder="输入实测体重"
                      required
                    />
                  </label>
                  <label className="grow">
                    状态备注
                    <input
                      name="note"
                      maxLength={500}
                      placeholder="睡眠、旅行、饮食感受…"
                    />
                  </label>
                  <button disabled={busy} className="primary">
                    保存记录
                  </button>
                </form>
              </section>
              <div className="health-note">
                <Leaf size={23} />
                <div>
                  <h3>稳一点，才能走得更远。</h3>
                  <p>
                    {w.settings.baseline &&
                    w.settings.target &&
                    daysBetween(w.settings.start, w.settings.end) > 0
                      ? `按起始估计 ${w.settings.baseline} kg 计算，到目标平均需要每周变化约 ${((w.settings.baseline - w.settings.target) / (daysBetween(w.settings.start, w.settings.end) / 7)).toFixed(2)} kg。`
                      : ""}
                    常见的渐进减重建议约为每周 0.5–1
                    kg；更快的目标建议先和医生或营养师讨论。短期体重也受水分影响，不采用脱水、断食冲刺或牺牲肌肉的方式。旅行期间优先规律饮食、适量步行和睡眠。
                  </p>
                  <a
                    href={resources.find((r) => r.track === "health")!.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看 NHS 参考建议 ↗
                  </a>
                </div>
              </div>
              <div className="panel">
                <h2>记录明细</h2>
                {[...weights].reverse().map((x) => (
                  <div className="record-line" key={x.date}>
                    <span>{x.date}</span>
                    <strong>{x.value} kg</strong>
                    <span>{x.note}</span>
                    <button
                      className="icon-button"
                      aria-label={"删除 " + x.date + " 体重"}
                      disabled={busy}
                      onClick={() => {
                        if (confirm("删除这次称重记录？"))
                          void save({
                            ...w,
                            weights: w.weights.filter((v) => v.date !== x.date),
                          });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {view === "journal" && (
            <>
              <div className="section-actions">
                <div className="track-tabs">
                  <button
                    className={journalTrack === "all" ? "active" : ""}
                    onClick={() => setJournalTrack("all")}
                  >
                    全部记录
                  </button>
                  {tracks.map((t) => (
                    <button
                      key={t.id}
                      className={journalTrack === t.id ? "active" : ""}
                      onClick={() => setJournalTrack(t.id)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <button
                  className="primary"
                  onClick={() =>
                    setNoteEdit({
                      id: uid(),
                      date: today,
                      title: "",
                      body: "",
                      track: "life",
                    })
                  }
                >
                  <Plus size={16} />
                  写一篇
                </button>
              </div>
              <div className="note-grid">
                {w.notes
                  .filter(
                    (n) => journalTrack === "all" || n.track === journalTrack,
                  )
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((n) => (
                    <button
                      className="panel note-card"
                      key={n.id}
                      onClick={() => setNoteEdit({ ...n })}
                    >
                      <div>
                        <Pill track={n.track} />
                        <small>{n.date}</small>
                      </div>
                      <h2>{n.title}</h2>
                      <p>{n.body}</p>
                      <span className="text-button">
                        继续写 <ArrowUpRight size={15} />
                      </span>
                    </button>
                  ))}
              </div>
              {!w.notes.length && (
                <div className="panel empty">
                  <BookOpen />
                  <h3>想法不必完整，先写下来。</h3>
                  <p>
                    也可以记录一次模拟交易：为什么做、什么会证明判断错了、结果学到了什么。
                  </p>
                </div>
              )}
              <section className="panel">
                <h2>以前的笔记与技能</h2>
                <p className="muted">旧版本的内容依然保留。点击可编辑。</p>
                {legacy
                  .filter(
                    (n) =>
                      n.kind === "note" ||
                      n.kind === "skill" ||
                      n.kind === "task",
                  )
                  .map((n) => (
                    <details className="legacy-note" key={n.id}>
                      <summary>
                        {n.kind === "task"
                          ? "待办 · "
                          : n.kind === "skill"
                            ? "技能 · "
                            : ""}
                        {n.title} <span>{n.date}</span>
                      </summary>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const data = new FormData(e.currentTarget);
                          setBusy(true);
                          try {
                            const r = await fetch("/api/items", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ...n,
                                title: String(data.get("title")),
                                body: String(data.get("body")),
                              }),
                            });
                            if (!r.ok) throw Error("旧笔记保存失败");
                            await reload();
                            setNotice("旧内容已保存");
                          } catch (e) {
                            setError((e as Error).message);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <input
                          aria-label="旧内容标题"
                          name="title"
                          defaultValue={n.title}
                          required
                          maxLength={200}
                        />
                        <textarea
                          aria-label="旧内容正文"
                          name="body"
                          defaultValue={n.body}
                          rows={5}
                          maxLength={50000}
                        />
                        <button className="secondary" disabled={busy}>
                          保存修改
                        </button>
                      </form>
                    </details>
                  ))}
              </section>
            </>
          )}
          {view === "deadlines" && (
            <>
              <div className="section-actions">
                <p className="muted">
                  按你的设备时区显示。站内显示倒计时；关闭网页后的提醒需导入日历。
                </p>
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      "assignments.ics",
                      calendarFile(w),
                      "text/calendar",
                    )
                  }
                >
                  <Download size={16} />
                  导出日历提醒
                </button>
                <button
                  className="primary"
                  onClick={() =>
                    setDeadlineEdit({
                      id: uid(),
                      title: "",
                      due: new Date(Date.now() + 86400000).toISOString(),
                      course: "",
                      url: "",
                      submitted: false,
                      note: "",
                    })
                  }
                >
                  <Plus size={16} />
                  添加作业
                </button>
              </div>
              <div className="panel">
                {!w.deadlines.length && (
                  <div className="empty">
                    <CalendarClock />
                    <h3>把下一次 deadline 写下来。</h3>
                    <p>课程、提交时间、提交网址和备注都可以放在一起。</p>
                  </div>
                )}
                {[...w.deadlines]
                  .sort((a, b) => a.due.localeCompare(b.due))
                  .map((d) => (
                    <div className="assignment" key={d.id}>
                      <button
                        className={
                          "check-box " + (d.submitted ? "checked" : "")
                        }
                        aria-label={
                          (d.submitted ? "取消提交标记 " : "标记已提交 ") +
                          d.title
                        }
                        disabled={busy}
                        onClick={() =>
                          void save({
                            ...w,
                            deadlines: w.deadlines.map((v) =>
                              v.id === d.id
                                ? { ...v, submitted: !v.submitted }
                                : v,
                            ),
                          })
                        }
                      >
                        {d.submitted && <Check size={14} />}
                      </button>
                      <button
                        className="task-copy"
                        onClick={() => setDeadlineEdit({ ...d })}
                      >
                        <strong>{d.title}</strong>
                        <span>
                          {d.course} · {new Date(d.due).toLocaleString("zh-CN")}
                        </span>
                        <p>{d.note}</p>
                      </button>
                      <span
                        className={
                          "pill " +
                          (!d.submitted && Date.parse(d.due) < now
                            ? "overdue"
                            : "life")
                        }
                      >
                        {d.submitted
                          ? "已提交"
                          : Date.parse(d.due) < now
                            ? "已逾期"
                            : "待提交"}
                      </span>
                      {/^https?:\/\//.test(d.url) && (
                        <a
                          className="icon-button"
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="打开提交页面"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  ))}
              </div>
              <div className="info-note">
                日历文件包含截止前 1 天和 2
                小时的提醒；实际通知由日历应用设置决定。修改截止日后，请在日历里同步更新，避免旧提醒残留。
              </div>
            </>
          )}
          {view === "files" && (
            <section className="panel">
              <div className="panel-title">
                <div>
                  <h2>文件与成果收藏</h2>
                  <p className="muted">
                    单个文件上限 20 MB · 保存在你的私人存储空间
                  </p>
                </div>
                <label className="primary">
                  <Upload size={16} />
                  上传文件
                  <input
                    hidden
                    type="file"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 20 * 1024 * 1024) {
                        setError("请选择 20 MB 以内的文件");
                        return;
                      }
                      setBusy(true);
                      try {
                        const data = new FormData();
                        data.append("file", file);
                        const r = await fetch("/api/files", {
                          method: "POST",
                          body: data,
                        });
                        if (!r.ok) throw Error("上传失败，请重试");
                        await reload();
                        setNotice("文件已上传");
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </div>
              {legacy.filter((x) => x.kind === "file").length ? (
                legacy
                  .filter((x) => x.kind === "file")
                  .map((x) => (
                    <a
                      className="file-row"
                      key={x.id}
                      href={"/api/files?id=" + encodeURIComponent(x.id)}
                    >
                      <FolderOpen />
                      <div>
                        <strong>{x.name}</strong>
                        <small>
                          {(x.size / 1024 / 1024).toFixed(2)} MB · {x.date}
                        </small>
                      </div>
                      <Download size={19} />
                    </a>
                  ))
              ) : (
                <div className="empty">
                  <FolderOpen />
                  <h3>存下一份值得留下的成果。</h3>
                  <p>简历、报告、录音、作业，都可以收藏在这里。</p>
                </div>
              )}
            </section>
          )}
          {view === "settings" && (
            <>
              <section className="panel">
                <h2>这个阶段的计划</h2>
                <form
                  className="settings-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const d = new FormData(e.currentTarget),
                      settings = {
                        name: String(d.get("name")),
                        start: String(d.get("start")),
                        end: String(d.get("end")),
                        hours: Number(d.get("hours")),
                        baseline: d.get("baseline")
                          ? Number(d.get("baseline"))
                          : null,
                        target: d.get("target")
                          ? Number(d.get("target"))
                          : null,
                      };
                    if (settings.end < settings.start) {
                      setError("结束日期必须晚于开始日期");
                      return;
                    }
                    await save({ ...w, settings });
                  }}
                >
                  <label>
                    称呼
                    <input
                      name="name"
                      defaultValue={w.settings.name}
                      required
                      maxLength={60}
                    />
                  </label>
                  <label>
                    每周可用时间 / 小时
                    <input
                      name="hours"
                      type="number"
                      min="1"
                      max="80"
                      defaultValue={w.settings.hours}
                      required
                    />
                  </label>
                  <label>
                    开始日期
                    <input
                      name="start"
                      type="date"
                      defaultValue={w.settings.start}
                      required
                    />
                  </label>
                  <label>
                    目标日期
                    <input
                      name="end"
                      type="date"
                      defaultValue={w.settings.end}
                      required
                    />
                  </label>
                  <label>
                    起始体重估计 / kg
                    <input
                      name="baseline"
                      type="number"
                      min="30"
                      max="400"
                      step="0.1"
                      defaultValue={w.settings.baseline ?? ""}
                    />
                  </label>
                  <label>
                    个人目标体重 / kg
                    <input
                      name="target"
                      type="number"
                      min="30"
                      max="400"
                      step="0.1"
                      defaultValue={w.settings.target ?? ""}
                    />
                  </label>
                  <p className="muted">
                    修改时间预算不会自动移动已有任务；可在目标路线中逐项调整日期和时长。
                  </p>
                  <button className="primary" disabled={busy}>
                    保存设置
                  </button>
                </form>
              </section>
              <section className="panel">
                <h2>旅行与轻量安排</h2>
                <p className="muted">
                  启用后日历会标记旅行日。任务保留，你可以按当天精力改期。
                </p>
                {w.trips.map((t) => (
                  <div className="trip-row" key={t.id}>
                    <Plane size={20} />
                    <div>
                      <strong>
                        {t.name}
                        {t.tentative ? "（暂定）" : ""}
                      </strong>
                      <span>
                        {t.start} — {t.end}
                      </span>
                    </div>
                    <button
                      className={t.enabled ? "secondary" : "primary"}
                      disabled={busy}
                      onClick={() =>
                        void save({
                          ...w,
                          trips: w.trips.map((v) =>
                            v.id === t.id ? { ...v, enabled: !v.enabled } : v,
                          ),
                        })
                      }
                    >
                      {t.enabled ? "已启用 · 关闭" : "启用"}
                    </button>
                  </div>
                ))}
                <form
                  className="inline-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      d = new FormData(form),
                      start = String(d.get("start")),
                      end = String(d.get("end"));
                    if (end < start) {
                      setError("旅行结束日期不能早于开始日期");
                      return;
                    }
                    if (
                      await save({
                        ...w,
                        trips: [
                          ...w.trips,
                          {
                            id: uid(),
                            name: String(d.get("name")),
                            start,
                            end,
                            tentative: false,
                            enabled: true,
                          },
                        ],
                      })
                    )
                      form.reset();
                  }}
                >
                  <label>
                    旅行名称
                    <input
                      name="name"
                      placeholder="一次短途旅行"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    开始
                    <input name="start" type="date" required />
                  </label>
                  <label>
                    结束
                    <input name="end" type="date" required />
                  </label>
                  <button className="secondary" disabled={busy}>
                    添加安排
                  </button>
                </form>
              </section>
              <section className="panel">
                <h2>私人计划与备份</h2>
                <p className="muted">
                  导出包含任务、体重、随笔和作业；上传的文件需单独下载。私人内容不会写入公开源码仓库。
                </p>
                <div className="section-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        "workbench-backup-" + today + ".json",
                        JSON.stringify(w, null, 2),
                      )
                    }
                  >
                    <Download size={16} />
                    导出工作台备份
                  </button>
                  <label className="secondary">
                    <Upload size={16} />
                    导入计划 / 备份
                    <input
                      hidden
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        void importPlan(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>SIYUAN / PERSONAL WORKSPACE</span>
            <span>一步一步，成为自己。</span>
          </footer>
        </main>
      </div>
      {taskForm && (
        <Modal
          feedback={error}
          refresh={() => void reload()}
          title={
            w.tasks.some((t) => t.id === taskForm.id)
              ? "编辑下一步"
              : "添加下一步"
          }
          close={() => setTaskForm(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save({
                  ...w,
                  tasks: [
                    ...w.tasks.filter((t) => t.id !== taskForm.id),
                    taskForm,
                  ],
                })
              )
                setTaskForm(null);
            }}
          >
            <label>
              任务标题
              <input
                autoFocus
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                maxLength={200}
                required
              />
            </label>
            <div className="form-grid">
              <label>
                主线
                <select
                  value={taskForm.track}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, track: e.target.value as Track })
                  }
                >
                  {tracks.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                日期
                <input
                  type="date"
                  value={taskForm.date}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, date: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                预计分钟
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={taskForm.minutes}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      minutes: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={taskForm.light}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, light: e.target.checked })
                  }
                />
                旅行也能做
              </label>
            </div>
            <label>
              怎么做 / 完成标准
              <textarea
                rows={4}
                value={taskForm.detail}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, detail: e.target.value })
                }
                maxLength={10000}
              />
            </label>
            <label>
              成果或反馈
              <textarea
                rows={2}
                placeholder="项目链接、一句心得、遇到的问题…"
                value={taskForm.proof}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, proof: e.target.value })
                }
                maxLength={2000}
              />
            </label>
            <div className="modal-actions">
              {w.tasks.some((t) => t.id === taskForm.id) && (
                <button
                  type="button"
                  className="danger text-button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      confirm("删除这个任务？") &&
                      (await save({
                        ...w,
                        tasks: w.tasks.filter((t) => t.id !== taskForm.id),
                      }))
                    )
                      setTaskForm(null);
                  }}
                >
                  删除任务
                </button>
              )}
              <button className="primary" disabled={busy}>
                保存任务
              </button>
            </div>
          </form>
        </Modal>
      )}
      {noteEdit && (
        <Modal
          title="随笔与反馈"
          feedback={error}
          refresh={() => void reload()}
          close={() => setNoteEdit(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await save({
                  ...w,
                  notes: [
                    ...w.notes.filter((n) => n.id !== noteEdit.id),
                    noteEdit,
                  ],
                })
              )
                setNoteEdit(null);
            }}
          >
            <label>
              标题
              <input
                autoFocus
                required
                maxLength={200}
                value={noteEdit.title}
                onChange={(e) =>
                  setNoteEdit({ ...noteEdit, title: e.target.value })
                }
              />
            </label>
            <div className="form-grid">
              <label>
                分类
                <select
                  value={noteEdit.track}
                  onChange={(e) =>
                    setNoteEdit({ ...noteEdit, track: e.target.value as Track })
                  }
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                日期
                <input
                  type="date"
                  required
                  value={noteEdit.date}
                  onChange={(e) =>
                    setNoteEdit({ ...noteEdit, date: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              写下你的想法
              <textarea
                rows={12}
                maxLength={10000}
                value={noteEdit.body}
                onChange={(e) =>
                  setNoteEdit({ ...noteEdit, body: e.target.value })
                }
              />
            </label>
            <div className="modal-actions">
              {w.notes.some((n) => n.id === noteEdit.id) && (
                <button
                  type="button"
                  className="danger text-button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      confirm("删除这篇随笔？") &&
                      (await save({
                        ...w,
                        notes: w.notes.filter((n) => n.id !== noteEdit.id),
                      }))
                    )
                      setNoteEdit(null);
                  }}
                >
                  删除随笔
                </button>
              )}
              <button className="primary" disabled={busy}>
                保存随笔
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deadlineEdit && (
        <Modal
          title="作业与截止日期"
          feedback={error}
          refresh={() => void reload()}
          close={() => setDeadlineEdit(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                due = new Date(String(f.get("due")));
              if (Number.isNaN(due.getTime())) return;
              const d = {
                ...deadlineEdit,
                title: String(f.get("title")),
                course: String(f.get("course")),
                url: String(f.get("url")),
                note: String(f.get("note")),
                due: due.toISOString(),
              };
              if (
                await save({
                  ...w,
                  deadlines: [...w.deadlines.filter((x) => x.id !== d.id), d],
                })
              )
                setDeadlineEdit(null);
            }}
          >
            <label>
              作业名称
              <input
                name="title"
                required
                maxLength={200}
                defaultValue={deadlineEdit.title}
              />
            </label>
            <label>
              课程
              <input
                name="course"
                maxLength={100}
                defaultValue={deadlineEdit.course}
              />
            </label>
            <label>
              提交截止时间（设备当地时间）
              <input
                name="due"
                type="datetime-local"
                required
                defaultValue={new Date(
                  Date.parse(deadlineEdit.due) -
                    new Date(deadlineEdit.due).getTimezoneOffset() * 60000,
                )
                  .toISOString()
                  .slice(0, 16)}
              />
            </label>
            <label>
              提交页面
              <input
                name="url"
                type="url"
                placeholder="https://…"
                defaultValue={deadlineEdit.url}
              />
            </label>
            <label>
              要求与备注
              <textarea
                name="note"
                rows={4}
                maxLength={10000}
                defaultValue={deadlineEdit.note}
              />
            </label>
            <div className="modal-actions">
              {w.deadlines.some((d) => d.id === deadlineEdit.id) && (
                <button
                  type="button"
                  className="danger text-button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      confirm("删除这个截止日期？") &&
                      (await save({
                        ...w,
                        deadlines: w.deadlines.filter(
                          (d) => d.id !== deadlineEdit.id,
                        ),
                      }))
                    )
                      setDeadlineEdit(null);
                  }}
                >
                  删除
                </button>
              )}
              <button className="primary" disabled={busy}>
                保存截止日
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Modal({
  title,
  close,
  children,
  feedback,
  refresh,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  feedback?: string;
  refresh?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-label={title} onCancel={close}>
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="关闭窗口">
          <X size={20} />
        </button>
      </div>
      {feedback && (
        <div role="alert" className="alert error">
          {feedback}
          <button type="button" onClick={refresh}>
            刷新数据
          </button>
        </div>
      )}
      {children}
    </dialog>
  );
}
function WeightChart({ weights }: { weights: Workspace["weights"] }) {
  if (!weights.length)
    return (
      <div className="chart-empty">
        <Activity size={30} />
        <p>记录第一次体重后，这里会画出你的真实趋势。</p>
      </div>
    );
  const data = weights.slice(-30),
    min = Math.min(...data.map((x) => x.value)) - 1,
    max = Math.max(...data.map((x) => x.value)) + 1;
  const x = (i: number) =>
      50 + (data.length === 1 ? 0.5 : i / (data.length - 1)) * 790,
    y = (v: number) => 180 - ((v - min) / (max - min)) * 140;
  return (
    <div className="chart">
      <svg
        viewBox="0 0 900 230"
        role="img"
        aria-label={"最近 " + data.length + " 次体重趋势"}
      >
        {[0, 1, 2].map((i) => {
          const v = min + ((max - min) * i) / 2;
          return (
            <g key={i}>
              <line x1="50" x2="850" y1={y(v)} y2={y(v)} stroke="#e8e8e0" />
              <text x="0" y={y(v) + 4} fontSize="12" fill="#777">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
        <polyline
          points={data.map((v, i) => `${x(i)},${y(v.value)}`).join(" ")}
          fill="none"
          stroke="#809546"
          strokeWidth="3"
        />
        {data.map((v, i) => (
          <circle key={v.date} cx={x(i)} cy={y(v.value)} r="5" fill="#809546">
            <title>
              {v.date}：{v.value} kg
            </title>
          </circle>
        ))}
        <text x="50" y="215" fontSize="13" fill="#777">
          {data[0].date}
        </text>
        <text x="850" y="215" textAnchor="end" fontSize="13" fill="#777">
          {data.at(-1)!.date}
        </text>
      </svg>
    </div>
  );
}
