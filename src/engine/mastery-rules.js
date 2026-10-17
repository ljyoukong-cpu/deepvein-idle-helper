// Mastery rules (client 1.0.1189): rank n costs 38 + 2n points, at most 20,000 ranks per track.
export const MASTERY_TRACKS = ['xp', 'gather', 'craft', 'offline', 'move', 'hp', 'maxhit', 'accuracy', 'rare', 'enhance'];
export const MASTERY_RANK_LIMIT = 20000;
export const MASTERY_NAMES_ZH = {xp: '经验获取', gather: '采集速度', craft: '制作速度', offline: '离线时长', move: '移动速度',
  hp: '生命上限', maxhit: '最大伤害', accuracy: '命中', rare: '寻宝', enhance: '强化成功率'};
export const rankCost = n => 38 + 2 * Math.max(1, Math.floor(n));
export const totalCost = n => { n = Math.max(0, Math.floor(n)); return 38 * n + n * (n + 1); };
export const spentPoints = ranks => Object.values(ranks).reduce((sum, n) => sum + totalCost(n), 0);
