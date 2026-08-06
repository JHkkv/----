#!/usr/bin/env python3
"""
AI 播客 TTS 生成脚本 v2 — edge-tss 版本
- 自然音色（edge-tss，微软 Azure 语音）
- 对话式聊天风格，语速接近真人交流
- 内容有灵活拓展，不死磕文本
- 句间停顿模拟真人对话节奏
"""

import asyncio
import edge_tts
from pydub import AudioSegment
import os
import random

OUTPUT_DIR = r"F:\测试工具\AI内容\AI播客"

# 角色配置
# 甲：男声，阳光活泼（吐槽担当）
# 乙：女声，温暖知性（打气担当）
JIA_VOICE = "zh-CN-YunxiNeural"    # 男声， lively/sunshine
YI_VOICE = "zh-CN-XiaoxiaoNeural"  # 女声，warm

# 语速：+15% 接近正常聊天交流（默认太慢）
JIA_RATE = "+18%"   # 甲稍快，爱抢话
YI_RATE = "+12%"    # 乙稍稳，但也不拖

# 语调微调（让两人更像在"聊天"而不是"念稿"）
JIA_PITCH = "+2Hz"
YI_PITCH = "+0Hz"

# 对话脚本 — 基于台本但做了口语化拓展
# 格式: (角色, 台词, 语速override, 语气标记)
# 语气标记: "normal" | "pause" | "sigh" | "laugh" | "serious" | "excited"
SCRIPT = [
    # ===== 【开场钩子】甲先扔数据炸弹 =====
    ("jia", "哎，你看到央行最新数据了吗？去年全国老百姓存了 14.6 万亿，但借出去才 4417 亿。", None, "normal"),
    ("jia", "差了整整 33 倍。就是现在大家越来越不敢花钱了，口袋里捂得紧紧的。", None, "normal"),
    ("yi", "（叹气）不是不想花啊，是真不敢花。", None, "sigh"),
    ("yi", "我上个月打开工资条一看，个税没变、房租没变、到手那点钱也没变——但我心里就是慌。", None, "normal"),
    
    # ===== 【切入主题】自然过渡 =====
    ("jia", "所以今天咱俩就替所有打工人聊个最实在的话题——钱越来越难挣的时候，怎么把钱守住。", None, "normal"),
    ("yi", "对，不讲那些大词儿，就说三件事：怎么攒下钱、怎么不踩坑、还有怎么别把心态搞崩。", None, "normal"),
    
    # ===== 【板块一 · 职业与抗风险】=====
    ("jia", "先说饭碗吧。今年超过 1200 万毕业生涌入就业市场，创历史新高了。你知道招聘缩成什么样了吗？", None, "normal"),
    ("jia", "以前程序员可是香饽饽对吧？现在招人也收紧了不少。", None, "normal"),
    ("yi", "（倒吸一口凉气）程序员都这样了……那咱普通打工人可咋整啊？", None, "sigh"),
    ("jia", "所以现在最傻的事，就是干等着升职加薪。真不是靠等的，你得让自己变得不容易被替代。", None, "normal"),
    ("yi", "那你说怎么办？", None, "normal"),
    ("jia", "我考考你啊——如果行业风向变了，你觉得什么样的人最不容易被淘汰？", None, "normal"),
    ("yi", "（停顿两秒）……行，跟你交个底吧。我现在每天下班都学一个新技能，跟本职工种沾边的。", "+5%", "normal"),
    ("yi", "不为别的，就为简历上多一行字。多一条路嘛。", None, "normal"),
    ("jia", "这就对了嘛！副业不是非得让你当网红，是给自己多拴一根安全绳。", None, "excited"),
    ("jia", "现在好多人副业收入能占到家里收入的将近五分之一——不是说发财啊，是兜底。", None, "normal"),
    ("yi", "（点头）饭碗这个东西……一个，真不够用了。", None, "normal"),
    
    # ===== 【板块二 · 现金流与消费】=====
    ("yi", "说到花钱，我现在真的只认刚需两个字。", None, "normal"),
    ("yi", "以前大促还凑满减呢，现在连券都懒得领——就要现货直降，别整那些花活。", None, "normal"),
    ("jia", "哈哈对，你知不知道现在 1 万块存银行，一年利息才多少？125 块！一杯奶茶就没了。", None, "laugh"),
    ("yi", "但是！我得说但是啊——省归省，别把日子过成苦行僧。", None, "excited"),
    ("yi", "我有个同事，一年不买一件衣服，可演唱会抢票比谁都快，体检也舍得花钱。", None, "normal"),
    ("jia", "哎，这就叫会花。我总结了一句话——", None, "normal"),
    ("jia", "钱花在保值的地方：健康、技能、存款。别花在贬值的地方：面子、冲动、跟风。", "-5%", "serious"),
    ("yi", "（手指敲太阳穴）面子、冲动、跟风——行，刻这儿了，忘不了。", None, "laugh"),
    
    # ===== 【板块三 · 负债与投资】=====
    ("jia", "再说个绝对不能碰的坑啊。现在债务压力大的朋友不在少数，所以两件事千万别干。", None, "serious"),
    ("yi", "你说。", None, "normal"),
    ("jia", "第一，别加杠杆。你看现在好多人抢着提前还贷，图什么？一身轻，比什么都值钱。", None, "normal"),
    ("yi", "（抢话）第二！别碰那种承诺高回报的！", "+10%", "excited"),
    ("jia", "对对对，就这句话——你图人家利息，人家图你本金。", None, "serious"),
    ("yi", "这话我得刻烟吸肺。我爸前两年就差点买了那种东西，被我硬拦住了。", None, "normal"),
    ("yi", "那会儿他眼睛都红了，我就是拿这句话给劝住的。现在想想都后怕。", None, "sigh"),
    
    # ===== 【板块四 · 心态与长期主义】=====
    ("jia", "其实你想想，经济这东西跟天气一样，有四季轮回的。", None, "normal"),
    ("jia", "现在就是入冬前的秋天——不是让你慌啊，是让你学会怎么过冬。", None, "normal"),
    ("yi", "而且你知道吗，很多今天特别牛的品牌，当年都是在穷日子里扎下根的。", None, "normal"),
    ("yi", "越是环境紧，越有人能熬出头。", None, "normal"),
    ("jia", "所以普通人的'明哲保身'，不是躲进角落啥也不干。", None, "normal"),
    ("jia", "是把日子过扎实——存钱、学本事、照顾好身体跟家人、别被吓破胆。", None, "normal"),
    ("yi", "我最近特信一句话——低谷不是拿来熬的，是拿来练内功的。", None, "normal"),
    ("yi", "等春天来了，你还在牌桌上，你就赢了。", None, "normal"),
    
    # ===== 【结尾 CTA】=====
    ("jia", "哎，你觉得现在最重要的是什么？多存钱？多学本事？还是稳住心态？", None, "normal"),
    ("jia", "评论区聊聊你的排序啊。", None, "normal"),
    ("yi", "咱打工人就一句——先活下来，再活得好。散会！", None, "excited"),
]

PAUSE_AFTER_JIA_MS = 400   # 甲说完乙接话的间隔（模拟真人接话）
PAUSE_AFTER_YI_MS = 600    # 乙说完甲接话的间隔（稍长，甲爱思考）
THOUGHT_PAUSE_MS = 1200    # "思考"停顿（如"……"）


async def generate_speech(text, voice, rate=None, pitch=None):
    """用 edge-tts 生成单句语音"""
    # 构建 SSML 风格的参数
    rate = rate or (JIA_RATE if voice == JIA_VOICE else YI_RATE)
    pitch = pitch or (JIA_PITCH if voice == JIA_VOICE else YI_PITCH)
    
    # 清理文本中的语气标记
    text = text.replace("（叹气）", "").replace("（倒吸一口凉气）", "")
    text = text.replace("（点头）", "").replace("（抢话）", "")
    text = text.replace("（手指敲太阳穴）", "").replace("（停顿两秒）", "")
    text = text.replace("（思考）", "").strip()
    
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    audio_data = b""
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    
    if not audio_data:
        raise ValueError(f"TTS 生成失败: {text[:50]}...")
    
    return AudioSegment.from_mp3(audio_data)


def get_pause_duration(prev_role, next_role, mood):
    """根据对话节奏决定停顿长度"""
    if mood == "sigh":
        return 800
    elif mood == "serious":
        return 700
    elif mood == "excited":
        return 200  # 抢话风格
    elif mood == "laugh":
        return 300
    
    if prev_role == "jia" and next_role == "yi":
        return PAUSE_AFTER_JIA_MS + random.randint(-100, 100)
    elif prev_role == "yi" and next_role == "jia":
        return PAUSE_AFTER_YI_MS + random.randint(-100, 100)
    return 500


async def main():
    print("=" * 60)
    print("AI 播客 TTS 生成 v2 (edge-tts)")
    print("=" * 60)
    print(f"甲音色: {JIA_VOICE} (语速 {JIA_RATE})")
    print(f"乙音色: {YI_VOICE} (语速 {YI_RATE})")
    print(f"共 {len(SCRIPT)} 段对话")
    print()
    
    podcast = AudioSegment.silent(duration=0)
    
    prev_role = None
    for i, (role, text, rate_override, mood) in enumerate(SCRIPT):
        voice = JIA_VOICE if role == "jia" else YI_VOICE
        role_name = "甲" if role == "jia" else "乙"
        rate = rate_override or (JIA_RATE if role == "jia" else YI_RATE)
        
        # 清理后的文本用于日志
        clean_text = text.replace("（叹气）", "").replace("（倒吸一口凉气）", "")
        clean_text = clean_text.replace("（点头）", "").replace("（抢话）", "")
        clean_text = clean_text.replace("（手指敲太阳穴）", "").replace("（停顿两秒）", "")
        clean_text = clean_text.strip()
        
        print(f"  [{i+1:02d}/{len(SCRIPT)}] {role_name} [{mood}]: {clean_text[:40]}...")
        
        try:
            audio = await generate_speech(clean_text, voice, rate=rate)
            
            # 添加停顿
            if i > 0:
                pause_ms = get_pause_duration(prev_role, role, mood)
                # "……" 等特殊停顿
                if "……" in text or mood == "sigh":
                    pause_ms = max(pause_ms, THOUGHT_PAUSE_MS)
                podcast += AudioSegment.silent(duration=pause_ms)
            
            # 语气效果处理
            if mood == "sigh":
                # 叹气：音量降低 3dB
                audio = audio - 3
            elif mood == "laugh":
                # 笑声：尾音上扬，加一点音量
                audio = audio + 1
            
            podcast += audio
            prev_role = role
            
        except Exception as e:
            print(f"  ❌ 错误: {e}")
            continue
    
    # 淡入淡出
    podcast = podcast.fade_in(500).fade_out(800)
    
    # 输出
    output_path = os.path.join(OUTPUT_DIR, "podcast-v2-edge.mp3")
    podcast.export(output_path, format="mp3", bitrate="192k", parameters=["-q:a", "0"])
    
    duration_sec = len(podcast) / 1000
    file_size_kb = os.path.getsize(output_path) / 1024
    
    print()
    print("=" * 60)
    print(f"✅ 完成！播客已保存:")
    print(f"   {output_path}")
    print(f"   总时长: {duration_sec:.1f} 秒 ({duration_sec/60:.1f} 分钟)")
    print(f"   文件大小: {file_size_kb:.1f} KB ({file_size_kb/1024:.1f} MB)")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
