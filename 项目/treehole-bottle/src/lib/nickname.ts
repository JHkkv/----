const PREFIXES = [
  "海浪",
  "星海",
  "深海",
  "夜海",
  "暖风",
  "微风",
  "月光",
  "晨曦",
  "暮色",
  "云朵",
] as const;

const SUFFIXES = [
  "旅人",
  "行者",
  "过客",
  "寄信人",
  "守夜人",
  "拾荒者",
  "听风者",
  "梦游人",
] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateNickname(): string {
  const prefix = pickRandom(PREFIXES);
  const suffix = pickRandom(SUFFIXES);
  return `${prefix}${suffix}`;
}
