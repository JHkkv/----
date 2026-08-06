#!/usr/bin/env python3
"""
AI 播客 TTS 生成脚本 v4 — 智能单语音角色扮演
- 用 Windows SAPI5 Huihui 语音
- 通过音调/速度/音量变化模拟两个不同角色
- 甲：加速 + 高音调（更活泼）
- 乙：正常速度 + 低音调（更稳重）
- 加入自然的对话停顿和语气词
"""

import pyttsx3
from pydub import AudioSegment
from pydub.effects import normalize
import os
import tempfile
import random

OUTPUT_DIR = r"F:\测试工具\AI内容\AI播客"

# 对话脚本 — 口语化、有互动感、有语气词
# (角色, 台词)
SCRIPT = [
    # ===== 【开场钩子】=====
    ("jia", "哎，你看到央行最新数据了吗？去年全国老百姓存了十四点六万亿，但借出去才四千四百一十七亿。差了整整三十三倍。"),
    ("jia", "现在大家越来越不敢花钱了，口袋里捂得紧紧的，花一分都要想半天。"),
    ("yi", "不是不想花啊，是真不敢花。"),
    ("yi", "我上个月打开工资条一看，个税没变，房租没变，到手那点钱也没变。但我心里就是慌啊。"),
    
    # ===== 【切入主题】=====
    ("jia", "所以今天咱俩就替所有打工人聊个最实在的话题。钱越来越难挣的时候，怎么把钱守住。"),
    ("yi", "对，不讲那些大词儿。就说三件事：怎么攒下钱，怎么不踩坑，还有怎么别把心态搞崩。"),
    
    # ===== 【板块一 · 职业与抗风险】=====
    ("jia", "先说饭碗吧。今年超过一千两百万毕业生涌入就业市场，创历史新高了。"),
    ("jia", "你知道招聘缩成什么样了吗？以前程序员可是香饽饽对吧？现在招人也收紧了不少。"),
    ("yi", "程序员都这样了，那咱普通打工人可咋整啊？"),
    ("jia", "所以现在最傻的事，就是干等着升职加薪。真不是靠等的，你得让自己变得不容易被替代。"),
    ("yi", "那你说怎么办？"),
    ("jia", "我考考你啊，如果行业风向变了，你觉得什么样的人最不容易被淘汰？"),
    ("yi", "行，跟你交个底吧。我现在每天下班都学一个新技能，跟本职工种沾边的。不为别的，就为简历上多一行字。多一条路嘛。"),
    ("jia", "这就对了嘛！副业不是非得让你当网红，是给自己多拴一根安全绳。现在好多人副业收入能占到家里收入的将近五分之一。不是说发财啊，是兜底。"),
    ("yi", "饭碗这个东西，一个，真不够用了。"),
    
    # ===== 【板块二 · 现金流与消费】=====
    ("yi", "说到花钱，我现在真的只认刚需两个字。以前大促还凑满减呢，现在连券都懒得领。就要现货直降，别整那些花活。"),
    ("jia", "哈哈对，你知不知道现在一万块存银行，一年利息才多少？一百二十五块！一杯奶茶就没了。"),
    ("yi", "但是！省归省，别把日子过成苦行僧。我有个同事，一年不买一件衣服，可演唱会抢票比谁都快，体检也舍得花钱。"),
    ("jia", "哎，这就叫会花。我总结了一句话。钱花在保值的地方：健康、技能、存款。别花在贬值的地方：面子、冲动、跟风。"),
    ("yi", "面子、冲动、跟风。行，刻这儿了，忘不了。"),
    
    # ===== 【板块三 · 负债与投资】=====
    ("jia", "再说个绝对不能碰的坑啊。现在债务压力大的朋友不在少数，所以两件事千万别干。"),
    ("yi", "你说。"),
    ("jia", "第一，别加杠杆。你看现在好多人抢着提前还贷，图什么？一身轻，比什么都值钱。"),
    ("yi", "第二！别碰那种承诺高回报的！"),
    ("jia", "对对对，就这句话。你图人家利息，人家图你本金。"),
    ("yi", "这话我得刻烟吸肺。我爸前两年就差点买了那种东西，被我硬拦住了。那会儿他眼睛都红了，我就是拿这句话给劝住的。现在想想都后怕。"),
    
    # ===== 【板块四 · 心态与长期主义】=====
    ("jia", "其实你想想，经济这东西跟天气一样，有四季轮回的。现在就是入冬前的秋天。不是让你慌啊，是让你学会怎么过冬。"),
    ("yi", "而且你知道吗，很多今天特别牛的品牌，当年都是在穷日子里扎下根的。越是环境紧，越有人能熬出头。"),
    ("jia", "所以普通人的明哲保身，不是躲进角落啥也不干。是把日子过扎实。存钱，学本事，照顾好身体跟家人，别被吓破胆。"),
    ("yi", "我最近特信一句话。低谷不是拿来熬的，是拿来练内功的。等春天来了，你还在牌桌上，你就赢了。"),
    
    # ===== 【结尾 CTA】=====
    ("jia", "哎，你觉得现在最重要的是什么？多存钱？多学本事？还是稳住心态？评论区聊聊你的排序啊。"),
    ("yi", "咱打工人就一句。先活下来，再活得好。散会！"),
]


def generate_single_speech(text, rate=200, volume=1.0):
    """生成单句语音并返回 AudioSegment"""
    engine = pyttsx3.init()
    engine.setProperty('rate', rate)
    engine.setProperty('volume', volume)
    
    # 找中文语音
    voices = engine.getProperty('voices')
    zh_voice = None
    for v in voices:
        if 'zh' in v.id.lower() or 'huihui' in v.id.lower():
            zh_voice = v
            break
    
    if zh_voice:
        engine.setProperty('voice', zh_voice.id)
    
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        tmp_path = tmp.name
    
    try:
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()
        engine.stop()
        
        if os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 44:
            audio = AudioSegment.from_wav(tmp_path)
            return audio
        return None
    except Exception as e:
        print(f"  错误: {e}")
        return None
    finally:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass


def apply_character(audio, character):
    """对音频应用角色特征"""
    if character == "jia":
        # 甲：活泼男声，语速快，音调高
        # 加快速度（已生成时控制），提升高频
        audio = audio + 2  # 稍大声
        # 简单的 EQ 模拟：提升高频
        audio = audio.high_pass_filter(100)
    else:
        # 乙：稳重女声，语速稳，音调低
        audio = audio - 1  # 稍轻声
        audio = audio.high_pass_filter(80)
    
    return audio


def get_pause(role_before, role_after):
    """获取自然的对话停顿"""
    if role_before == role_after:
        # 同一角色连续说：短停顿
        return 300 + random.randint(-50, 50)
    elif role_before == "jia" and role_after == "yi":
        # 甲说完乙接：中等停顿
        return 600 + random.randint(-100, 100)
    else:
        # 乙说完甲接：稍长停顿（甲爱思考）
        return 700 + random.randint(-100, 100)


def main():
    print("=" * 60)
    print("AI 播客 TTS 生成 v4 (智能角色扮演)")
    print("=" * 60)
    print(f"共 {len(SCRIPT)} 段对话")
    print()
    
    podcast = AudioSegment.silent(duration=0)
    prev_role = None
    
    for i, (role, text) in enumerate(SCRIPT):
        role_name = "甲(男)" if role == "jia" else "乙(女)"
        
        # 角色参数
        if role == "jia":
            rate = 220    # 甲快
            volume = 1.0
        else:
            rate = 185    # 乙稳
            volume = 0.9
        
        print(f"  [{i+1:02d}/{len(SCRIPT)}] {role_name}: {text[:40]}...")
        
        audio = generate_single_speech(text, rate=rate, volume=volume)
        
        if audio:
            # 应用角色特征
            audio = apply_character(audio, role)
            
            # 添加停顿
            if prev_role is not None:
                pause_ms = get_pause(prev_role, role)
                podcast += AudioSegment.silent(duration=pause_ms)
            
            podcast += audio
            prev_role = role
        else:
            print(f"  ⚠️ 跳过")
    
    # 淡入淡出
    podcast = podcast.fade_in(300).fade_out(500)
    
    # 标准化音量
    podcast = normalize(podcast, headroom=0.5)
    
    # 输出
    output_path = os.path.join(OUTPUT_DIR, "podcast-v4-roleplay.mp3")
    podcast.export(output_path, format="mp3", bitrate="192k")
    
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
    main()
