#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate-data-sources.py — 数据源 URL 可达性校验（可选辅助脚本）

用途：P3 调研阶段，对采集到的候选 URL 做批量可达性检查，
      快速筛掉失效/404 链接，避免方案引用已失效的数据源。

用法：
  python scripts/validate-data-sources.py urls.txt
  python scripts/validate-data-sources.py --file urls.txt --timeout 8 --limit 20

输入文件格式（每行一个 URL）：
  https://example.com/product/123
  https://example.com/bestsellers
"""

import argparse
import concurrent.futures as futures
import sys
import urllib.request
import urllib.error


def check_url(url, timeout=8, user_agent=None):
    """检查单个 URL 的可达性，返回 (url, status, error)。"""
    headers = {"User-Agent": user_agent or "Mozilla/5.0 (compatible; ecommerce-optimizer/1.0)"}
    req = urllib.request.Request(url, headers=headers, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return (url, resp.status, None)
    except urllib.error.HTTPError as e:
        # 部分站点不支持 HEAD，退回 GET（不下载 body）
        try:
            req = urllib.request.Request(url, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return (url, resp.status, None)
        except urllib.error.HTTPError as e2:
            return (url, e2.code, str(e2.reason))
        except Exception as e2:
            return (url, None, str(e2))
    except Exception as e:
        return (url, None, str(e))


def read_urls(path):
    with open(path, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip() and not line.startswith("#")]


def main():
    parser = argparse.ArgumentParser(description="批量校验数据源 URL 可达性")
    parser.add_argument("input", help="URL 列表文件（每行一个）")
    parser.add_argument("--timeout", type=int, default=8, help="单请求超时秒数（默认 8）")
    parser.add_argument("--limit", type=int, default=50, help="最多检查数量（默认 50）")
    parser.add_argument("--workers", type=int, default=5, help="并行数（默认 5）")
    parser.add_argument("--user-agent", default=None, help="自定义 UA")
    args = parser.parse_args()

    urls = read_urls(args.input)[: args.limit]
    if not urls:
        print("✗ 输入文件为空或没有有效 URL")
        sys.exit(1)

    print(f"→ 检查 {len(urls)} 个 URL（并行 {args.workers}）...")
    results = []
    with futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(check_url, u, args.timeout, args.user_agent): u for u in urls}
        for fut in futures.as_completed(futs):
            results.append(fut.result())

    results.sort(key=lambda r: (r[1] is None, r[1] if r[1] else 0))
    ok = [r for r in results if r[1] and 200 <= r[1] < 400]
    bad = [r for r in results if not (r[1] and 200 <= r[1] < 400)]

    print("\n== 可用（可引用） ==")
    for url, status, err in ok:
        print(f"  [{status}] {url}")
    if bad:
        print("\n== 不可用（需处理/降级） ==")
        for url, status, err in bad:
            print(f"  [{'None' if status is None else status}] {url}  ({err or '未知'})")

    print(f"\n结论：{len(ok)} 可用 / {len(bad)} 不可用")
    print("提示：不可用的 URL 在方案中标注'未检索到公开数据'，或改用手动抓取验证。")
    sys.exit(0 if not bad else 1)


if __name__ == "__main__":
    main()
