#!/usr/bin/env python3
"""
AI 播客 TTS 生成脚本
- 逐句生成甲和乙的语音
- 自动合并为完整播客
- 句间留 0.5 秒停顿
"""

from gtts import gTTS
from pydub import AudioSegment
import os
import io

OUTPUT_DIR = r"F:\测试工具\AI内容\AI播客"

# 角色语音配置
# 甲：男声（中文），乙：女声（中文）
# gTTS 的 zh-CN 语音默认是女声，可以用不同语调模拟两个角色
JIA_VOICE = "zh-CN"  # 甲
YI_VOICE = "zh-CN"   # 乙

# 台本对话（按时间顺序）
SCRIPT = [
    # 【开场钩子】
    ("jia", "央行数据，去年全国老百姓存了 14.6 万亿，借了才 4417 亿——差了 33 倍。越来越多的人把钱捂在口袋里，花一分都要想半天。"),
    ("yi", "不是不想花，是不敢花。我上个月打开工资条，个税没变、房租没变、到手那点钱也没变——但我心里就是不敢动。"),
    
    # 【切入主题】
    ("jia", "所以今天，咱俩就替所有打工人聊个最实在的——钱越来越难挣的时候，怎么把钱守住。"),
    ("yi", "不讲大词儿，就说三件事：怎么攒下钱、怎么不踩坑、怎么不把心态搞崩。"),
    
    # 【板块一 · 职业与抗风险】
    ("jia", "先说饭碗。今年超过 1200 万毕业生涌入就业市场，创了历史新高。招聘缩成什么样了——就连以前最热门的程序员岗位，现在招人也收紧了不少。"),
    ("yi", "程序员都这样了，那咱普通打工人……"),
    ("jia", "所以现在最傻的事，就是干等着升职加薪。不是靠等，是让自己变得不容易被替代。我考考你——如果行业风向变了，你觉得什么样的人，最不容易被淘汰？"),
    ("yi", "行，我跟你交个底。我现在每天下班学一个新技能，跟本职工种沾边的。不为别的，就为简历上多一行字。"),
    ("jia", "这就对了。副业不是非让你当网红，是给自己多拴一根安全绳。现在好多人副业收入能占到家里收入的将近五分之一——不是发财，是兜底。"),
    ("yi", "饭碗这个东西，一个，真不够用了。"),
    
    # 【板块二 · 现金流与消费】
    ("yi", "说到花钱，我现在真的只认刚需。以前大促还凑满减，现在连券都懒得领——就要现货直降，别整那些花活。"),
    ("jia", "你知道现在 1 万块存银行，一年利息多少吗？125 块，一杯奶茶就没了。"),
    ("yi", "但是！省归省，别把日子过成苦行僧。我有个同事，一年不买一件衣服，可演唱会抢票比谁都快，体检也舍得花钱。"),
    ("jia", "这就叫会花。一句话——钱花在保值的地方：健康、技能、存款。别花在贬值的地方：面子、冲动、跟风。"),
    ("yi", "面子、冲动、跟风——行，刻这儿了。"),
    
    # 【板块三 · 负债与投资】
    ("jia", "再说个绝对不能碰的坑。现在债务压力大的朋友，不在少数。所以两件事千万别干。"),
    ("yi", "你说。"),
    ("yi", "别碰承诺高回报的那种！"),
    ("jia", "对。你图人家利息，人家图你本金。"),
    ("yi", "这话我得刻烟吸肺。我爸前两年就差点买了那种东西，被我拦住了。那会儿他眼睛都红了，我就是拿这句话劝住他的。"),
    
    # 【板块四 · 心态与长期主义】
    ("jia", "其实你想想，经济跟天气一样，有四季。现在就是入冬前的秋天——不是让你慌，是让你学会过冬。"),
    ("yi", "而且你知道吗，很多今天特别牛的品牌，当年都是在穷日子里扎下根的。越是环境紧，越有人熬出头。"),
    ("jia", "所以普通人的明哲保身，不是躲进角落，是把日子过扎实——存钱、学本事、照顾好身体跟家人、别被吓破胆。"),
    ("yi", "我最近特信一句话——低谷不是拿来熬的，是拿来练内功的。等春天来了，你还在牌桌上，你就赢了。"),
    
    # 【结尾 CTA】
    ("jia", "你觉得现在最重要的是什么——多存钱、多学本事、还是稳住心态？评论区聊聊你的排序。"),
    ("yi", "咱打工人就一句——先活下来，再活得好。散会！"),
]

PAUSE_MS = 500  # 句间停顿 500ms

def generate_tts(text, voice, slow=False):
    """生成单句 TTS"""
    tts = gTTS(text=text, lang=voice, slow=slow)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return AudioSegment.from_mp3(audio_buffer)

def main():
    print("开始生成播客音频...")
    
    podcast = AudioSegment.silent(duration=0)
    silence = AudioSegment.silent(duration=PAUSE_MS)
    
    for i, (role, text) in enumerate(SCRIPT):
        voice = JIA_VOICE if role == "jia" else YI_VOICE
        role_name = "甲" if role == "jia" else "乙"
        
        print(f"  [{i+1}/{len(SCRIPT)}] {role_name}: {text[:30]}...")
        
        try:
            audio = generate_tts(text, voice)
            podcast += audio + silence
        except Exception as e:
            print(f"  错误: {e}")
            continue
    
    # 淡入淡出
    podcast = podcast.fade_in(300).fade_out(500)
    
    # 输出
    output_path = os.path.join(OUTPUT_DIR, "podcast-final.mp3")
    podcast.export(output_path, format="mp3", bitrate="192k")
    
    duration_sec = len(podcast) / 1000
    print(f"\n完成！播客已保存: {output_path}")
    print(f"总时长: {duration_sec:.1f} 秒 ({duration_sec/60:.1f} 分钟)")
    print(f"文件大小: {os.path.getsize(output_path) / 1024:.1f} KB")

if __name__ == "__main__":
    main()
