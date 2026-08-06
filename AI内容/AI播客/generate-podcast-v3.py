#!/usr/bin/env python3
"""
AI 播客 TTS 生成脚本 v3 — pyttsx3 离线版本
- 完全离线（Windows SAPI5）
- 男女双声（不同 voice ID）
- 语速/音量/音调可调
- 对话式聊天风格
"""

import pyttsx3
from pydub import AudioSegment
import os
import tempfile
import random

OUTPUT_DIR = r"F:\测试工具\AI内容\AI播客"

# 对话脚本 — 口语化、有互动感
# (角色, 台词, 语气)
SCRIPT = [
    # ===== 【开场钩子】=====
    ("jia", "哎，你看到央行最新数据了吗？去年全国老百姓存了 14.6 万亿，但借出去才 4417 亿。差了整整 33 倍。", "normal"),
    ("jia", "现在大家越来越不敢花钱了，口袋里捂得紧紧的，花一分都要想半天。", "normal"),
    ("yi", "不是不想花啊，是真不敢花。", "sigh"),
    ("yi", "我上个月打开工资条一看，个税没变、房租没变、到手那点钱也没变——但我心里就是慌。", "normal"),
    
    # ===== 【切入主题】=====
    ("jia", "所以今天咱俩就替所有打工人聊个最实在的话题——钱越来越难挣的时候，怎么把钱守住。", "normal"),
    ("yi", "对，不讲那些大词儿，就说三件事：怎么攒下钱、怎么不踩坑、还有怎么别把心态搞崩。", "normal"),
    
    # ===== 【板块一 · 职业与抗风险】=====
    ("jia", "先说饭碗吧。今年超过 1200 万毕业生涌入就业市场，创历史新高了。", "normal"),
    ("jia", "你知道招聘缩成什么样了吗？以前程序员可是香饽饽对吧？现在招人也收紧了不少。", "normal"),
    ("yi", "程序员都这样了……那咱普通打工人可咋整啊？", "sigh"),
    ("jia", "所以现在最傻的事，就是干等着升职加薪。真不是靠等的，你得让自己变得不容易被替代。", "normal"),
    ("yi", "那你说怎么办？", "normal"),
    ("jia", "我考考你啊——如果行业风向变了，你觉得什么样的人最不容易被淘汰？", "normal"),
    ("yi", "行，跟你交个底吧。我现在每天下班都学一个新技能，跟本职工种沾边的。不为别的，就为简历上多一行字。", "normal"),
    ("yi", "多一条路嘛。", "normal"),
    ("jia", "这就对了嘛！副业不是非得让你当网红，是给自己多拴一根安全绳。", "excited"),
    ("jia", "现在好多人副业收入能占到家里收入的将近五分之一——不是说发财啊，是兜底。", "normal"),
    ("yi", "饭碗这个东西……一个，真不够用了。", "normal"),
    
    # ===== 【板块二 · 现金流与消费】=====
    ("yi", "说到花钱，我现在真的只认刚需两个字。以前大促还凑满减呢，现在连券都懒得领——就要现货直降，别整那些花活。", "normal"),
    ("jia", "哈哈对，你知不知道现在 1 万块存银行，一年利息才多少？125 块！一杯奶茶就没了。", "laugh"),
    ("yi", "但是！省归省，别把日子过成苦行僧。我有个同事，一年不买一件衣服，可演唱会抢票比谁都快，体检也舍得花钱。", "excited"),
    ("jia", "哎，这就叫会花。我总结了一句话——钱花在保值的地方：健康、技能、存款。别花在贬值的地方：面子、冲动、跟风。", "serious"),
    ("yi", "面子、冲动、跟风——行，刻这儿了，忘不了。", "laugh"),
    
    # ===== 【板块三 · 负债与投资】=====
    ("jia", "再说个绝对不能碰的坑啊。现在债务压力大的朋友不在少数，所以两件事千万别干。", "serious"),
    ("yi", "你说。", "normal"),
    ("jia", "第一，别加杠杆。你看现在好多人抢着提前还贷，图什么？一身轻，比什么都值钱。", "normal"),
    ("yi", "第二！别碰那种承诺高回报的！", "excited"),
    ("jia", "对对对，就这句话——你图人家利息，人家图你本金。", "serious"),
    ("yi", "这话我得刻烟吸肺。我爸前两年就差点买了那种东西，被我硬拦住了。那会儿他眼睛都红了，我就是拿这句话给劝住的。现在想想都后怕。", "normal"),
    
    # ===== 【板块四 · 心态与长期主义】=====
    ("jia", "其实你想想，经济这东西跟天气一样，有四季轮回的。现在就是入冬前的秋天——不是让你慌啊，是让你学会怎么过冬。", "normal"),
    ("yi", "而且你知道吗，很多今天特别牛的品牌，当年都是在穷日子里扎下根的。越是环境紧，越有人能熬出头。", "normal"),
    ("jia", "所以普通人的'明哲保身'，不是躲进角落啥也不干。是把日子过扎实——存钱、学本事、照顾好身体跟家人、别被吓破胆。", "normal"),
    ("yi", "我最近特信一句话——低谷不是拿来熬的，是拿来练内功的。等春天来了，你还在牌桌上，你就赢了。", "normal"),
    
    # ===== 【结尾 CTA】=====
    ("jia", "哎，你觉得现在最重要的是什么？多存钱？多学本事？还是稳住心态？评论区聊聊你的排序啊。", "normal"),
    ("yi", "咱打工人就一句——先活下来，再活得好。散会！", "excited"),
]


def get_voices(engine):
    """获取可用的语音列表"""
    voices = engine.getProperty('voices')
    print(f"\n可用语音 ({len(voices)} 个):")
    for i, v in enumerate(voices):
        print(f"  [{i}] {v.id}")
        print(f"      name={getattr(v, 'name', 'N/A')}")
    return voices


def find_chinese_voices(voices):
    """查找中文语音"""
    zh_voices = []
    for v in voices:
        vid = v.id.lower()
        if 'zh' in vid or 'chinese' in vid or 'huihui' in vid or 'kangkang' in vid or 'yaoyao' in vid:
            zh_voices.append(v)
    return zh_voices


def main():
    print("=" * 60)
    print("AI 播客 TTS 生成 v3 (pyttsx3 离线)")
    print("=" * 60)
    
    engine = pyttsx3.init()
    voices = get_voices(engine)
    zh_voices = find_chinese_voices(voices)
    
    if not zh_voices:
        print("\n⚠️ 未找到中文语音，使用默认语音")
        jia_voice = voices[0]
        yi_voice = voices[1] if len(voices) > 1 else voices[0]
    else:
        print(f"\n找到 {len(zh_voices)} 个中文语音:")
        for v in zh_voices:
            print(f"  - {v.id}")
        # 如果有多个中文语音，选两个不同的
        jia_voice = zh_voices[0]
        yi_voice = zh_voices[-1] if len(zh_voices) > 1 else zh_voices[0]
    
    print(f"\n甲: {jia_voice.id}")
    print(f"乙: {yi_voice.id}")
    print(f"共 {len(SCRIPT)} 段对话")
    
    podcast = AudioSegment.silent(duration=0)
    
    for i, (role, text, mood) in enumerate(SCRIPT):
        voice = jia_voice if role == "jia" else yi_voice
        role_name = "甲" if role == "jia" else "乙"
        
        # 根据角色和语气设置参数
        if role == "jia":
            rate = 200    # 甲稍快
            volume = 1.0
        else:
            rate = 180    # 乙稍稳
            volume = 1.0
        
        # 语气调整
        if mood == "sigh":
            rate -= 20
            volume = 0.85
        elif mood == "excited":
            rate += 30
            volume = 1.0
        elif mood == "serious":
            rate -= 15
            volume = 0.95
        elif mood == "laugh":
            rate += 10
        
        print(f"  [{i+1:02d}/{len(SCRIPT)}] {role_name} [{mood}]: {text[:40]}...")
        
        # 用临时文件保存音频
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            engine.setProperty('voice', voice.id)
            engine.setProperty('rate', rate)
            engine.setProperty('volume', volume)
            
            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            
            if os.path.exists(tmp_path) and os.path.getsize(tmp_path) > 0:
                audio = AudioSegment.from_wav(tmp_path)
                
                # 添加停顿
                if i > 0:
                    if mood == "sigh":
                        pause_ms = 1000
                    elif mood == "serious":
                        pause_ms = 800
                    elif mood == "excited":
                        pause_ms = 300
                    else:
                        pause_ms = 500 + random.randint(-100, 100)
                    podcast += AudioSegment.silent(duration=pause_ms)
                
                # 音量处理
                if mood == "sigh":
                    audio = audio - 3
                
                podcast += audio
            else:
                print(f"  ⚠️ 音频文件为空")
                
        except Exception as e:
            print(f"  ❌ 错误: {e}")
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except:
                    pass
    
    engine.stop()
    
    # 淡入淡出
    podcast = podcast.fade_in(500).fade_out(800)
    
    # 输出
    output_path = os.path.join(OUTPUT_DIR, "podcast-v3-pyttsx3.mp3")
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
