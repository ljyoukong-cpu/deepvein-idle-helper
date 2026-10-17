// Quest-point perks (client 1.0.1189, `buyPerk {id}`). Points come only from
// quests (+1 daily, +3 weekly). They are left to the player: pocket space and
// small speed gains cannot be valued reliably enough to spend them automatically.
export const PERKS=[
  {id:'pockets',name:'大口袋',ranks:5,cost:n=>20+20*n},
  {id:'quick',name:'快手',ranks:10,cost:n=>15+10*n},
  {id:'hands',name:'稳手',ranks:10,cost:n=>10+8*n},
  {id:'meals',name:'丰盛餐食',ranks:10,cost:n=>10+8*n},
  {id:'rest',name:'快速休息',ranks:4,cost:n=>30+30*n},
];
export const perkById=id=>PERKS.find(perk=>perk.id===id)??null;

export function perkRank(p,id){return Number.isInteger(p.perks?.[id])?p.perks[id]:0;}
export function nextPerkCost(p,id) {
  const perk=perkById(id),rank=perkRank(p,id);
  return !perk||rank>=perk.ranks?null:perk.cost(rank);
}

// For the plan panel: points held.
export function perkOverview(p) {
  return Number.isInteger(p?.questPoints)?{points:p.questPoints}:null;
}
