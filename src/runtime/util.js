// Protocol and prediction evidence: research/world-boss-mechanics.md.
export const copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
export {distance} from '../planner/items.js';
export const sorted=v=>Array.isArray(v)?v.map(sorted):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).sort().map(k=>[k,sorted(v[k])])):v;
export const same=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
export const wait=reason=>({label:'世界 Boss',reason});
export const action=(intent,reason)=>({intent,label:'世界 Boss',reason});
export const point=p=>Number.isInteger(p?.x)&&Number.isInteger(p?.y);
