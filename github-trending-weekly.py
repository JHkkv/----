#!/usr/bin/env python3
"""GitHub Trending Weekly Reporter — save top repos to Markdown."""
import urllib.request, json, datetime, os, sys, re

OUTPUT_DIR = r"F:\测试工具\AI内容"

# ── helpers ──────────────────────────────────────────────────────
def fetch_json(url):
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "ClaudeCodeBot"
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())

def fetch_trending_html():
    """Fallback: scrape the official GitHub trending page."""
    url = "https://github.com/trending?since=weekly"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })
    with urllib.request.urlopen(req, timeout=20) as resp:
        html = resp.read().decode("utf-8", errors="replace")
    return html

def parse_trending_html(html):
    """Extract repo info from the trending page HTML."""
    repos = []
    # Look for repo name patterns in the HTML
    # The trending page typically has h2 tags with repo links
    # Pattern: /owner/repo in href
    seen = set()
    for match in re.finditer(r'href="/([a-zA-Z0-9._-]+)/([a-zA-Z0-9._-]+)"', html):
        owner, name = match.group(1), match.group(2)
        full = f"{owner}/{name}"
        if full in seen:
            continue
        # Skip non-repo links
        if any(skip in name.lower() for skip in ['trending', 'explore', 'sponsors', 'collections']):
            continue
        seen.add(full)
        repos.append({"fullName": full})
    return repos[:30]

def get_repo_detail(owner, name):
    """Get detailed info for a specific repo via GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{name}"
    try:
        return fetch_json(url)
    except Exception:
        return None

# ── main ─────────────────────────────────────────────────────────
def main():
    today = datetime.date.today()
    week_ago = today - datetime.timedelta(days=7)
    date_str = week_ago.strftime("%Y-%m-%d")

    print(f"[*] Fetching repos created since {date_str} ...")

    results = []

    # Method 1: GitHub Search API (recently created repos by stars)
    try:
        url = (f"https://api.github.com/search/repositories"
               f"?q=created:%3E{date_str}&sort=stars&order=desc&per_page=20")
        data = fetch_json(url)
        for item in data.get("items", [])[:20]:
            results.append({
                "name": item["full_name"],
                "stars": item["stargazers_count"],
                "lang": item.get("language", "?"),
                "desc": (item.get("description") or "N/A")[:200],
                "url": item["html_url"],
                "forks": item.get("forks_count", 0),
                "source": "newly-created"
            })
        print(f"  [ok] GitHub Search API: {len(results)} repos found")
    except Exception as e:
        print(f"  [!] GitHub Search API failed: {e}")

    # Method 2: Enrich with trending data
    try:
        trending = fetch_trending_html()
        trending_repos = parse_trending_html(trending)
        # Get details for trending repos not already in results
        existing = {r["name"] for r in results}
        for tr in trending_repos:
            if tr["fullName"] in existing:
                continue
            detail = get_repo_detail(*tr["fullName"].split("/"))
            if detail:
                results.append({
                    "name": detail["full_name"],
                    "stars": detail.get("stargazers_count", 0),
                    "lang": detail.get("language", "?"),
                    "desc": (detail.get("description") or "N/A")[:200],
                    "url": detail["html_url"],
                    "forks": detail.get("forks_count", 0),
                    "source": "trending-page"
                })
                existing.add(detail["full_name"])
        print(f"  [ok] Trending page: total {len(results)} repos")
    except Exception as e:
        print(f"  [!] Trending page scrape failed: {e}")

    # Sort by stars
    results.sort(key=lambda r: r["stars"], reverse=True)

    # Keep top 20
    results = results[:20]

    # ── Generate Markdown ────────────────────────────────────────────
    lines = []
    lines.append(f"# GitHub Trending Weekly Report")
    lines.append(f"")
    lines.append(f"> 统计周期: {week_ago} ~ {today}")
    lines.append(f"> 生成时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"> 共收录: {len(results)} 个项目")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"")

    for i, repo in enumerate(results, 1):
        emoji = ["\U0001f947", "\U0001f948", "\U0001f949"][i - 1] if i <= 3 else f"{i}."
        lines.append(f"### {emoji} [{repo['name']}]({repo['url']})")
        lines.append(f"")
        lines.append(f"| 属性 | 值 |")
        lines.append(f"|------|-----|")
        lines.append(f"| Star | {repo['stars']:,} |")
        lines.append(f"| Fork | {repo['forks']:,} |")
        lines.append(f"| 语言 | {repo['lang']} |")
        lines.append(f"")
        lines.append(f"**简介**: {repo['desc']}")
        lines.append(f"")
        lines.append(f"**来源**: {repo['source']}")
        lines.append(f"")
        lines.append(f"---")
        lines.append(f"")

    # ── Write file ───────────────────────────────────────────────────
    filename = f"github-trending-{today.isoformat()}.md"
    filepath = os.path.join(OUTPUT_DIR, filename)
    content = "\n".join(lines)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"\n[DONE] Report saved: {filepath}")
    print(f"        {len(results)} repos, top star count: {results[0]['stars']:,}" if results else "        No repos found")

if __name__ == "__main__":
    main()
