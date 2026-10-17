export const HOT_FOLLOW_SKILLS=['mining','fishing','woodcutting','thieving','cooking','smithing','fletching','herblore','crafting','combat'];
export const HOT_FOLLOW_DEFAULTS={enabled:false,sides:[],countRarity:false,minMinutes:8,leadMinutes:0};
export const hotRotationCache=new WeakMap();
export function normalizeHotFollow(value={}) {
  const sides=Array.isArray(value.sides)?[...new Set(value.sides.filter(skill=>HOT_FOLLOW_SKILLS.includes(skill)))]:[];
  const number=(input,fallback)=>input==null||input===''||!Number.isFinite(Number(input))?fallback:Number(input);
  return {enabled:value.enabled===true,sides,minMinutes:Math.max(3,Math.min(20,number(value.minMinutes,HOT_FOLLOW_DEFAULTS.minMinutes))),
    leadMinutes:Math.max(0,Math.min(30,number(value.leadMinutes,HOT_FOLLOW_DEFAULTS.leadMinutes))),countRarity:value.countRarity===true};
}
export function hotSkillAt(data,tick) {
  const hot=data.hot,period=hot?.periodTicks??3000,order=hot?.order??[],seed=hot?.seed??1213158433;
  if(!order.length||!Number.isFinite(tick))return null;
  const hash=(value,salt)=>{let result=(value^2654435769)>>>0;result=Math.imul(result^salt>>>0,2246822507)>>>0;
    result=(result^(result>>>13))>>>0;result=Math.imul(result^seed>>>0,3266489909)>>>0;return (result^(result>>>16))>>>0;};
  const index=Math.max(0,Math.floor(tick/period));
  const cacheKey=[period,seed,hot.xp??1.2,hot.rarity??1.25,order.join(','),(hot.rareSkills??[]).join(',')].join('|');
  let cache=hotRotationCache.get(data);
  if(!cache||cache.key!==cacheKey) {
    cache={key:cacheKey,skills:[hash(0,1)%order.length],max:0};
    hotRotationCache.set(data,cache);
  }
  while(cache.max<index) {
    const previous=cache.skills[cache.max];
    let current=hash(cache.max+1,1)%order.length;
    if(current===previous)current=(current+1)%order.length;
    cache.skills.push(current);cache.max++;
  }
  const skill=order[cache.skills[index]],rare=(hot.rareSkills??[]).includes(skill)&&hash(index,2)%3===0;
  return {skill,kind:rare?'rarity':'xp',mult:rare?(hot.rarity??1.25):(hot.xp??1.2),start:index*period,end:(index+1)*period};
}
export function hotWindows(data,tick,count=4) {
  const current=hotSkillAt(data,tick);if(!current)return [];
  return Array.from({length:Math.max(0,Math.floor(count)+1)},(_,offset)=>{
    const window=hotSkillAt(data,current.start+offset*(data.hot?.periodTicks??3000));
    return {start:window.start,end:window.end,skill:window.skill,kind:window.kind,mult:window.mult};
  });
}
