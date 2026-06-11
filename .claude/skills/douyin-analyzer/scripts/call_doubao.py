#!/usr/bin/env python3
"""
调用豆包（火山引擎 ARK Responses API）进行多模态感知或文本分析。

用法:
    # 文本分析模式（原有）
    python call_doubao.py "<分析提示词>"
    echo "提示词" | python call_doubao.py

    # 图片感知模式（纯描述/OCR，不做分析）
    python call_doubao.py --image "<图片URL>" --prompt "请描述这张图片"

    # 音频感知模式（纯转写，不做分析）
    python call_doubao.py --audio "<音频URL>"

环境变量:
    DOUBAO_API_KEY      火山引擎 API Key（必填）
    DOUBAO_API_ENDPOINT API 端点，默认 https://ark.cn-beijing.volces.com/api/v3/responses
    DOUBAO_MODEL        模型 ID，默认 doubao-seed-2-0-pro-260215

架构:
    感知模式（--image/--audio）：豆包提取原始信息 → stdout 输出纯文本 → Claude 分析
    分析模式（默认）：豆包直接进行深度分析并输出结构化报告
"""

import json
import os
import sys
import urllib.error
import urllib.request

# ── 默认配置 ──────────────────────────────────────────────
DEFAULT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/responses"
DEFAULT_MODEL = "doubao-seed-2-0-pro-260215"

# ── 感知模式提示词（纯提取，不做分析）────────────────────
PERCEPTION_IMAGE_PROMPT = (
    "请详细描述这张图片中的所有内容。包括："
    "1. 文字内容（逐字识别，保留原文格式）"
    "2. 布局结构和元素位置"
    "3. 图表数据（如有）"
    "4. 人物/物体及其特征"
    "5. 颜色和风格"
    "只做客观描述和文字提取，不做分析、评价或建议。"
)

PERCEPTION_AUDIO_PROMPT = (
    "请逐字转写这段音频的完整内容。"
    "如有多个说话人，请标注说话人切换。"
    "保留语气词、停顿和重复。"
    "只做转写，不做总结、分析或评价。"
)

ANALYSIS_SYSTEM_PROMPT = (
    "你是一位资深短视频内容分析师和运营策略专家，"
    "擅长拆解抖音爆款视频的内容结构、叙事技巧和传播逻辑。"
    "你的分析既有数据支撑，又能给出可操作的创作建议。"
)


def _get_config():
    """读取环境变量配置。"""
    api_key = os.environ.get("DOUBAO_API_KEY", "")
    endpoint = os.environ.get("DOUBAO_API_ENDPOINT", DEFAULT_ENDPOINT)
    model = os.environ.get("DOUBAO_MODEL", DEFAULT_MODEL)
    if not api_key:
        print("错误：未设置 DOUBAO_API_KEY 环境变量", file=sys.stderr)
        print("请在火山引擎控制台获取：https://console.volcengine.com/ark", file=sys.stderr)
        sys.exit(1)
    return api_key, endpoint, model


def _build_text_input(text: str, system: str = "") -> list[dict]:
    """构建纯文本 input（分析模式）。"""
    full_text = f"{system}\n\n---\n\n{text}" if system else text
    return [{"role": "user", "content": [{"type": "input_text", "text": full_text}]}]


def _build_image_input(image_url: str, prompt: str) -> list[dict]:
    """构建图片 + 文本混合 input（感知模式）。"""
    return [{
        "role": "user",
        "content": [
            {"type": "input_image", "image_url": image_url},
            {"type": "input_text", "text": prompt},
        ],
    }]


def _build_audio_input(audio_url: str, prompt: str) -> list[dict]:
    """构建音频 + 文本混合 input（感知模式）。"""
    return [{
        "role": "user",
        "content": [
            {"type": "input_audio", "audio_url": audio_url},
            {"type": "input_text", "text": prompt},
        ],
    }]


def _extract_output(result: dict) -> str:
    """从 Responses API 返回值中提取纯文本内容。"""
    for item in result.get("output", []):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if c.get("type") == "output_text":
                    return c.get("text", "")
    raise KeyError("output_text not found in response")


def _call_api(input_data: list[dict], model: str, endpoint: str, api_key: str) -> str:
    """发送请求到豆包 ARK API，返回提取的文本。"""
    payload = json.dumps(
        {"model": model, "input": input_data},
        ensure_ascii=False,
    ).encode("utf-8")

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            content = _extract_output(result)
            usage = result.get("usage", {})
            if usage:
                total = usage.get("total_tokens", "?")
                inp = usage.get("input_tokens", "?")
                out = usage.get("output_tokens", "?")
                reasoning = usage.get("output_tokens_details", {}).get("reasoning_tokens", 0)
                print(
                    f"[Token: {total} (入 {inp} + 出 {out}, 推理 {reasoning})]",
                    file=sys.stderr,
                )
            return content
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"API 请求失败 ({e.code}): {error_body}", file=sys.stderr)
        if e.code == 401:
            print("提示：API Key 无效或已过期", file=sys.stderr)
        elif e.code == 400:
            print("提示：请求参数错误，请确认 model/input 格式", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"网络连接失败: {e.reason}", file=sys.stderr)
        sys.exit(1)
    except (KeyError, IndexError):
        print("API 响应格式异常", file=sys.stderr)
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(1)


# ── 公共函数（供外部调用）────────────────────────────────

def perceive_image(image_url: str, prompt: str = "") -> str:
    """图片感知：发送图片给豆包，返回纯描述文本。"""
    api_key, endpoint, model = _get_config()
    p = prompt or PERCEPTION_IMAGE_PROMPT
    input_data = _build_image_input(image_url, p)
    return _call_api(input_data, model, endpoint, api_key)


def perceive_audio(audio_url: str, prompt: str = "") -> str:
    """音频感知：发送音频给豆包，返回转写文本。"""
    api_key, endpoint, model = _get_config()
    p = prompt or PERCEPTION_AUDIO_PROMPT
    input_data = _build_audio_input(audio_url, p)
    return _call_api(input_data, model, endpoint, api_key)


def analyze_text(prompt: str, system: str = "") -> str:
    """文本分析：发送文本给豆包，返回分析结果。"""
    api_key, endpoint, model = _get_config()
    sys_prompt = system or ANALYSIS_SYSTEM_PROMPT
    input_data = _build_text_input(prompt, sys_prompt)
    return _call_api(input_data, model, endpoint, api_key)


# ── CLI ───────────────────────────────────────────────────

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="豆包多模态 API 调用工具")
    parser.add_argument("text", nargs="?", help="文本提示词（分析模式）")
    parser.add_argument("--image", metavar="URL", help="图片 URL（感知模式）")
    parser.add_argument("--audio", metavar="URL", help="音频 URL（感知模式）")
    parser.add_argument("--prompt", metavar="TEXT", help="自定义感知提示词")
    args = parser.parse_args()

    if args.image:
        result = perceive_image(args.image, args.prompt or "")
    elif args.audio:
        result = perceive_audio(args.audio, args.prompt or "")
    else:
        prompt = args.text or sys.stdin.read().strip()
        if not prompt:
            print("用法: python call_doubao.py '<提示词>'", file=sys.stderr)
            print("      python call_doubao.py --image '<URL>'", file=sys.stderr)
            print("      python call_doubao.py --audio '<URL>'", file=sys.stderr)
            sys.exit(1)
        result = analyze_text(prompt)

    print(result)


if __name__ == "__main__":
    main()
