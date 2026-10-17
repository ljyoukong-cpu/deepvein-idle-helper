// Shared item, stock, pack, map and price arithmetic. Every module uses these
// instead of re-deriving them, so one rule has one definition.

// Item ids: base + rarity * rarityScale + enhancement * plusScale.
export const baseId=(data,id)=>id%data.plusScale%data.rarityScale;
export const rarityOf=(data,id)=>Math.floor(id%data.plusScale/data.rarityScale);
export const plusOf=(data,id)=>Math.floor(id/data.plusScale);
export const RARITY_NAMES=['','罕见','稀有','史诗','传说'];
export const qualityPrefix=(data,id)=>RARITY_NAMES[rarityOf(data,id)]?`${RARITY_NAMES[rarityOf(data,id)]} `:'';
// Display name with quality and enhancement, e.g. "史诗 Steel blade +2".
export const itemLabel=(data,id,name=data.items[baseId(data,id)]?.name??`物品 ${id}`)=>
  `${qualityPrefix(data,id)}${name}${id>=data.plusScale?` +${plusOf(data,id)}`:''}`;
// The same base in each quality from `from` to `to` (inclusive).
export const qualityIds=(data,id,from=0,to=data.rarityMultipliers.length-1)=>
  Array.from({length:to-from+1},(_,i)=>baseId(data,id)+(from+i)*data.rarityScale);

// Stock of one exact id. Bank, pack and overflow storage; worn items and coins
// are separate. `planner.count` deliberately omits overflow (not withdrawable).
export const packQty=(p,id)=>p.pack.reduce((n,i)=>i.itemId===id?n+i.qty:n,0);
export const shelfQty=(p,id)=>(p.bank[id]??0)+(p.overflow?.[id]??0);
export const stockQty=(p,id)=>shelfQty(p,id)+packQty(p,id);

// Pack space: 28 slots plus the pockets perk; a stackable kind takes one slot.
export const packCapacity=p=>28+Math.max(0,Math.floor(p.perks?.pockets??0));
export const packUsed=(data,p)=>p.pack.reduce((n,i)=>n+(data.items[baseId(data,i.itemId)]?.stackable?1:i.qty),0);
// Food taken per trip: -1 fills the pack, -2 leaves one slot, else the set count.
export const foodCarry=(p,capacity=packCapacity(p))=>
  p.foodPerTrip===-1?capacity:p.foodPerTrip===-2?Math.max(1,capacity-1):p.foodPerTrip??20;

// Map: tiles are Chebyshev distance apart; "at the bank" is within one tile.
export const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
export const nearestBank=(data,point)=>[...data.banks].sort((a,b)=>distance(point,a)-distance(point,b))[0];
export const nearBank=(data,p)=>data.banks.some(b=>distance(p,b)<=1);
// Walking stride (x1000 per tick) before potions: the mount's bonus, scaled by
// its own quality and +N table, and the move mastery. Rounded by callers.
export function baseStride(data,p) {
  const mount=p.equipment?.mount??0,g=data.gear.find(g=>g.itemId===baseId(data,mount)&&g.slot==='mount');
  const bonus=(g?.bonus??0)*([1,1.5,2.25,3.5,5][rarityOf(data,mount)]??1)*(1+.15*plusOf(data,mount));
  return (1000+Math.round(bonus*1000))*(1+.005*(p.masteries?.move??0));
}

// Prices: the merchant pays 40% of base value (at least 1); market sales pay
// the tax in basis points; a listing must clear the floor after tax.
// Coal fuels every bar at every quality (rarity recipes keep it common), so
// common coal is never sold or converted; rarer coal is only worth house points.
export const COAL_ID=5;
// Base items that can be sold at all: not coins, not the four untradable
// special items, and worth something (burnt food 70 sells for scrap).
export const tradableBase=(data,base)=>base!==data.coinId&&![294,295,296,297].includes(base)&&
  (data.items[base]?.value>0||base===70);
export const merchantPrice=(data,id)=>Math.max(1,Math.floor((data.items[baseId(data,id)]?.value??0)*.4));
export const netProceeds=(price,qty,taxBp)=>price*qty-Math.floor(price*qty*taxBp/10000);
export const minListPrice=(floor,taxBp)=>Math.floor(floor/(1-taxBp/10000))+1;
export const dayTicks=data=>86400000/data.tickMs;
