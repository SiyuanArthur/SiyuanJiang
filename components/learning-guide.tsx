"use client";
import type { Workspace } from "@/lib/workbench";
const lessons = [
  {
    id: "python",
    title: "01 · Python：把数据读进来",
    time: "基础 · 3–4 次学习",
    intro:
      "先学列表、字典、函数和文件读取。把重复操作封装成函数；遇到缺失值时先明确处理规则。",
    steps: [
      "创建一个虚拟环境，记录 Python 版本和依赖。",
      "自己制作含 patient_id、heart_rate 的小 CSV；读取数据，过滤空值，计算平均心率。",
      "加入空文件、非数字、缺失值三个输入，检查程序如何处理。",
    ],
    proof: "提交脚本、示例 CSV 和 README；解释每一行，不只贴教程代码。",
    links: [["Python 中文教程", "https://docs.python.org/zh-cn/3/tutorial/"]],
  },
  {
    id: "numpy",
    title: "02 · NumPy：理解数组和维度",
    time: "基础 · 3 次学习",
    intro:
      "一行一个样本，一列一个特征。先说清 shape，再做切片、广播和按轴计算。",
    steps: [
      "构造 shape=(100, 3) 的模拟数据，用固定随机种子保证可复现。",
      "计算每列均值与标准差，完成标准化；处理标准差为零的列。",
      "用 matplotlib 画原始与标准化分布，比较循环与数组运算。",
    ],
    proof:
      "一个 notebook，包含 shape 注释、图和标准化检查；解释 axis=0 与 axis=1。",
    links: [
      [
        "NumPy 入门",
        "https://numpy.org/doc/stable/user/absolute_beginners.html",
      ],
    ],
  },
  {
    id: "baseline",
    title: "03 · 机器学习：先做可靠的基线",
    time: "核心 · 3–4 次学习",
    intro:
      "训练集负责学习，验证集负责选择，测试集只用于最终评估。标准化也必须只在训练集拟合。",
    steps: [
      "用 scikit-learn 内置数据完成逻辑回归 Pipeline。",
      "比较混淆矩阵、precision、recall、F1 与 ROC-AUC，说明类别不平衡为何影响 accuracy。",
      "固定划分与随机种子，保留一个简单基线和错误分析。",
    ],
    proof: "结果表 + 可复现命令；说明数据泄漏是什么、如何避免。",
    links: [
      [
        "scikit-learn 入门",
        "https://scikit-learn.org/stable/getting_started.html",
      ],
    ],
  },
  {
    id: "torch",
    title: "04 · PyTorch：亲手跑通训练循环",
    time: "核心 · 4–5 次学习",
    intro:
      "每轮依次清空梯度、前向计算、计算损失、反向传播、更新参数。验证阶段切换 eval 并关闭梯度。",
    steps: [
      "按官方基础教程依次学 tensor、Dataset、DataLoader 和 autograd。",
      "在小数据上训练网络，画训练与验证损失，先确认能拟合少量样本。",
      "保存模型并在新进程载入预测，记录设备和依赖版本。",
    ],
    proof: "训练脚本、损失曲线、模型加载演示；能解释过拟合和学习率。",
    links: [
      [
        "PyTorch 基础教程",
        "https://docs.pytorch.org/tutorials/beginner/basics/intro.html",
      ],
    ],
  },
  {
    id: "ecg",
    title: "05 · 项目一：心电信号分类",
    time: "项目 · 约 2–3 周",
    intro:
      "先看波形和标注，再决定标签与切片规则。不同患者的数据应分组划分，避免同一患者同时出现在训练和测试中。",
    steps: [
      "阅读 MIT-BIH 数据说明，用 WFDB 读取一个记录，画波形和标注。",
      "写清采样率、心拍窗口和标签映射；明确哪些记录对应同一受试者。",
      "先做简单特征基线，再比较 1D CNN；记录各类召回率、宏平均 F1 和错误案例。",
    ],
    proof:
      "GitHub 项目：数据获取说明、患者级划分、可复现训练、结果表和局限；仅作学习研究，不作诊断。",
    links: [
      ["MIT-BIH 数据", "https://physionet.org/content/mitdb/1.0.0/"],
      ["WFDB 使用文档", "https://wfdb.readthedocs.io/en/latest/"],
    ],
  },
  {
    id: "image",
    title: "06 · 项目二：医学影像分割",
    time: "项目 · 约 2–3 周",
    intro:
      "先完成一个小型 2D 分割实验。图像与掩膜必须同步变换；病人级划分比随机图片划分更可靠。",
    steps: [
      "从 MONAI 官方教程选择可公开获取的分割数据，阅读许可及数据说明。",
      "可视化图像、掩膜叠加与增强结果；跑通 U-Net 基线。",
      "报告 Dice/IoU 与失败案例，比较一个改进；3D 或复杂模型留作扩展。",
    ],
    proof:
      "数据说明、训练命令、预测叠加图、指标与失败分析；能用 5 分钟介绍整个项目。",
    links: [["MONAI 官方教程", "https://github.com/Project-MONAI/tutorials"]],
  },
  {
    id: "leetcode",
    title: "07 · LeetCode：面试练习支线",
    time: "每周 2 次，每次 25–30 分钟",
    intro:
      "可以用，但它补充算法面试能力，不能代替生物医学项目。先用 Python，优先掌握解题思路与复杂度。练习占现有 20 小时预算，不额外叠加整套题库。",
    steps: [
      "第一组：数组与哈希表——两数之和、存在重复元素、有效的字母异位词。",
      "第二组：栈与二分——有效的括号、二分查找；第三组：链表与树——合并两个有序链表、二叉树最大深度。",
      "每题先独立想 15–20 分钟；卡住读提示，关掉答案重写，2 天后再做。记录时间/空间复杂度与边界测试。",
    ],
    proof:
      "7 道入门题的独立重做记录；之后按招聘要求扩展到 15–20 题，不以刷完 150 题为短期目标。",
    links: [
      [
        "LeetCode 中文学习计划",
        "https://leetcode.cn/studyplan/top-interview-150/",
      ],
    ],
  },
];
export default function LearningGuide({
  w,
  busy,
  save,
}: {
  w: Workspace;
  busy: boolean;
  save: (w: Workspace, message?: string) => Promise<boolean>;
}) {
  const completed = w.learning ?? [];
  return (
    <section className="panel study-panel">
      <p className="eyebrow">LEARN → BUILD → EXPLAIN</p>
      <h2>生物医学算法 · 动手教程</h2>
      <p>
        按 01–06 推进，LeetCode
        穿插进行。每次先读教程，再独立实践，最后把代码链接与复盘写进对应任务的成果栏。教程时间是参考，不保证完成后即可录用。
      </p>
      <p className="muted">
        已验收 {lessons.filter((l) => completed.includes(l.id)).length} /{" "}
        {lessons.length} 节 · 勾选只记录学习进度，不自动完成周任务。
      </p>
      {lessons.map((l) => (
        <details key={l.id}>
          <summary>
            {completed.includes(l.id) ? "✓ " : ""}
            {l.title}
            <span className="muted"> · {l.time}</span>
          </summary>
          <p>{l.intro}</p>
          <ol>
            {l.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="resource-list">
            {l.links.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noreferrer">
                {label} ↗
              </a>
            ))}
          </div>
          <p>
            <strong>验收成果：</strong>
            {l.proof}
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              save(
                {
                  ...w,
                  learning: completed.includes(l.id)
                    ? completed.filter((id) => id !== l.id)
                    : [...completed, l.id],
                },
                "学习进度已保存",
              )
            }
          >
            {completed.includes(l.id) ? "取消完成" : "我已完成练习与验收"}
          </button>
        </details>
      ))}
    </section>
  );
}
