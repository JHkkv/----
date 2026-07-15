# AI求职工具箱 — Resume Forge

🏭 **AI驱动的简历锻造系统。** 6阶段自动化：扫描本地项目挖掘真实技能 → 搜索已有简历存档 → 三梯队岗位匹配+薪资预期 → 职业空白期/Gap经历填充 → 话术转化（如"选品定价"→"多平台内容矩阵同步运营"）→ 质量自审。输出 MD + HTML（含证件照base64内嵌）+ TXT 三格式简历。支持纯真实版/多方向版/快速迭代版三种模式。

## 📂 文件索引

**【核心】resume-forge Skill**
- `resume-forge/SKILL.md` — 入口，触发词 `/resume-forge`
- `resume-forge/agent-prompts.md` — 6个Agent prompt定义
- `resume-forge/templates/resume-template.html` — HTML简历模板
- GitHub: https://github.com/JHkkv/resume-forge

**【案例】求职记录**
- `job-search-cases/2026-07-12-AI方向/` — AI内容运营方向完整案例（分析报告+面试准备+三格式简历）
- `job-search-cases/2026-06-19-luonanyang/` — 首批多方向求职案例

**【方法】知识库+提示词**
- `知识库/wiki/简历优化提示词.md`
- `知识库/wiki/岗位匹配提示词.md`
- `知识库/wiki/打招呼语生成提示词.md`
- `知识库/wiki/AI方向求职可行性分析-深度谈话报告.md`

**【发布】AI求职系列文案**（小红书文案创作 SKILL 产出）
- `小红书文案/AI求职系列/Day1-AI数据化简历.md`（663字符）
- `小红书文案/AI求职系列/Day2-AI经历翻译官.md`（707字符）
- `小红书文案/AI求职系列/Day3-JD镜子法简历诊断.md`（744字符）
- `小红书文案/AI求职系列/slides/` — 配套18张图文幻灯片

**【延伸】智投PWA**
- `项目/job-greeting-pwa/` — 求职打招呼语生成器PWA
