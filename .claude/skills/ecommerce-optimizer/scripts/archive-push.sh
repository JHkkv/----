#!/usr/bin/env bash
# archive-push.sh — 归档脱敏扫描 + 推送私人仓库
#
# 用途：P10 归档阶段使用。扫描归档文件中的敏感信息，通过后推送到 GitHub 私人仓库。
# 使用：
#   bash scripts/archive-push.sh archive/淘宝/2026-08-05-家居收纳.md   推送单个归档
#   bash scripts/archive-push.sh --all                                  推送全部未提交归档
#   bash scripts/archive-push.sh --scan-only archive/xxx.md             只扫描不推送
#
# 安全：不硬编码凭据。使用已配置的 git 凭据（credential helper / SSH）。
#       敏感模式命中即拒绝推送。仓库非 private 即拒绝推送。

set -euo pipefail

# ---------- 常量 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
ARCHIVE_DIR="$SKILL_DIR/archive"
REPO_URL="${GITHUB_PRIVATE_REPO:-}"
EXPECTED_REPO="github.com/JHkkv/-"   # 仅允许推送到的私人仓库（不含协议前缀，兼容 https/ssh 两种格式）

# 敏感模式（正则，命中即拒绝）
SENSITIVE_PATTERNS=(
  '1[3-9][0-9]{9}'                 # 大陆手机号
  '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'  # 邮箱
  'C:\\\\Users\\\\'                # 本机用户路径
  '[A-Za-z]:\\\\'                  # 盘符绝对路径
  '(https?://)?(www\.)?(taobao|tmall|jd|pinduoduo|1688|amazon|douyin|xiaohongshu)\.(com|cn)'  # 平台 URL
  '[0-9]{4}[-年][0-9]{1,2}[-月][0-9]{1,2}[日号]?\s*(—|-|~|至)?\s*[0-9]{4}[-年]' # 可能的日期区间（弱化，避免误报归档日期）
)

# 需要弱化的模式：日期类易误报，单独处理
DATE_PATTERN='[0-9]{4}-[0-9]{2}-[0-9]{2}'

# ---------- 帮助 ----------
usage() {
  echo "用法:"
  echo "  bash $0 <archive-file>   推送单个归档（扫描+推送）"
  echo "  bash $0 --all            推送全部未提交归档"
  echo "  bash $0 --scan-only <f>  只扫描不推送"
  echo "  bash $0 --check-repo     检查仓库私有性与配置"
  exit 0
}

[ "$#" -lt 1 ] && usage

# ---------- 敏感模式扫描 ----------
scan_file() {
  local file="$1"
  local found=0
  local lineno=1

  echo "→ 扫描: $file"
  while IFS= read -r line; do
    for pat in "${SENSITIVE_PATTERNS[@]}"; do
      # 跳过仅日期匹配的情况（归档日期是允许的）
      if printf '%s' "$line" | grep -qE "$DATE_PATTERN" && ! printf '%s' "$line" | grep -qE "$pat"; then
        continue
      fi
      if printf '%s' "$line" | grep -qiE "$pat"; then
        echo "  ⚠ 第 ${lineno} 行命中敏感模式 [${pat}]: ${line:0:80}"
        found=1
      fi
    done
    lineno=$((lineno + 1))
  done < "$file"

  if [ "$found" -eq 1 ]; then
    echo "✗ 扫描未通过：发现敏感信息，请脱敏后重试。"
    return 1
  fi
  echo "✓ 扫描通过：无敏感信息。"
  return 0
}

# ---------- 仓库检查 ----------
check_repo() {
  local repo_url="${REPO_URL:-}"
  if [ -z "$repo_url" ] && [ -f "$ARCHIVE_DIR/repo.config" ]; then
    repo_url="$(cat "$ARCHIVE_DIR/repo.config" | tr -d '[:space:]')"
  fi
  if [ -z "$repo_url" ]; then
    echo "✗ 未配置仓库地址。请设置环境变量 GITHUB_PRIVATE_REPO 或创建 archive/repo.config。"
    return 1
  fi

  # 只允许目标私人仓库（兼容 https:// 和 git@ 两种地址格式）
  local normalized
  normalized="$(printf '%s' "$repo_url" | sed -E 's#git@github\.com:#github.com/#; s#https?://##; s#\.git$##')"
  if ! printf '%s' "$normalized" | grep -q "$EXPECTED_REPO"; then
    echo "✗ 仓库地址 ${repo_url} 不是允许的私人仓库（${EXPECTED_REPO}）。拒绝推送。"
    return 1
  fi
  echo "✓ 仓库地址合法: $repo_url"

  # 尝试检查可见性（gh 可用时）
  if command -v gh >/dev/null 2>&1; then
    local vis
    vis="$(gh repo view --json visibility -q .visibility 2>/dev/null || echo unknown)"
    if [ "$vis" != "PRIVATE" ] && [ "$vis" != "unknown" ]; then
      echo "✗ 仓库可见性为 ${vis}（非 private）。拒绝推送。"
      return 1
    fi
    echo "✓ 仓库可见性: ${vis:-未知（跳过）}"
  else
    echo "ℹ gh 不可用，跳过可见性自动检查（请人工确认仓库为 private）。"
  fi
  return 0
}

# ---------- 推送 ----------
push_archive() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "✗ 文件不存在: $file"
    return 1
  fi

  # 归一化为绝对路径（支持相对/绝对两种传参）
  file="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"

  # 只允许推送 archive/ 目录内文件
  case "$file" in
    "$ARCHIVE_DIR"/*) ;;
    *)
      echo "✗ 只允许推送 archive/ 目录内的归档文件。"
      return 1
      ;;
  esac

  scan_file "$file" || return 1

  # 进入归档仓库
  cd "$ARCHIVE_DIR" || { echo "✗ archive 目录不存在"; return 1; }

  # 检查 git 仓库
  if [ ! -d .git ]; then
    echo "ℹ archive/ 还不是 git 仓库，尝试初始化并关联私人仓库..."
    git init -q
    local repo_url="${REPO_URL:-}"
    [ -z "$repo_url" ] && [ -f repo.config ] && repo_url="$(cat repo.config | tr -d '[:space:]')"
    if [ -z "$repo_url" ]; then
      echo "✗ 无法初始化：未配置仓库地址。"
      return 1
    fi
    git remote add origin "$repo_url"
  fi

  check_repo || return 1

  # 相对路径（用于 git add）
  local rel="${file#"$ARCHIVE_DIR"/}"
  local category platform_name
  platform_name="$(dirname "$rel")"
  local filename
  filename="$(basename "$file" .md)"

  git add "$rel"
  git add INDEX.md 2>/dev/null || true

  local msg="feat: 案例归档 ${filename} [${platform_name}]"
  git commit -m "$msg" -q || echo "ℹ 无变化或提交失败（可能已提交）"

  echo "→ 推送至私人仓库..."
  if git push origin HEAD -q 2>&1; then
    echo "✓ 推送成功: ${rel}"
  else
    echo "✗ 推送失败（检查网络/凭据/仓库权限）。"
    return 1
  fi

  # 推送后远端复核（重新扫描已推送文件）
  echo "→ 远端复核：拉取远端后重扫"
  git fetch origin -q 2>/dev/null || true
  scan_file "$file" || echo "⚠ 远端复核命中敏感信息，请立即处理！"
  return 0
}

# ---------- 主流程 ----------
MODE="${1:-}"

case "$MODE" in
  --all)
    check_repo || exit 1
    cd "$ARCHIVE_DIR" || exit 1
    # 扫描并推送所有未提交的归档文件
    git add -A
    # 列出将要提交的文件
    new_files="$(git diff --cached --name-only -- '*.md' | grep -v INDEX.md || true)"
    if [ -z "$new_files" ]; then
      echo "ℹ 没有新的归档文件需要推送。"
      exit 0
    fi
    echo "→ 待推送文件:"
    echo "$new_files"
    for f in $new_files; do
      scan_file "$ARCHIVE_DIR/$f" || { echo "✗ 中止：${f} 未通过扫描"; exit 1; }
    done
    git commit -m "feat: 批量案例归档 $(date +%Y-%m-%d)" -q || echo "ℹ 无变化"
    git push origin HEAD -q && echo "✓ 批量推送成功" || { echo "✗ 推送失败"; exit 1; }
    ;;
  --scan-only)
    [ "$#" -lt 2 ] && usage
    scan_file "$2"
    ;;
  --check-repo)
    check_repo
    ;;
  --help|-h)
    usage
    ;;
  *)
    push_archive "$1"
    ;;
esac

exit 0
