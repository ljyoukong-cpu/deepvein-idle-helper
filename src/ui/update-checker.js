export const SCRIPT_UPDATE_URL='https://raw.githubusercontent.com/ljyoukong-cpu/deepvein-idle-helper/main/deepvein-balanced.meta.js';
export const SCRIPT_INSTALL_URL='https://raw.githubusercontent.com/ljyoukong-cpu/deepvein-idle-helper/main/deepvein-balanced.user.js';
export const SCRIPT_CDN_ROOT='https://gcore.jsdelivr.net/gh/ljyoukong-cpu/deepvein-idle-helper@main/deepvein-balanced-cdn';

export function createUpdateChecker({version,fetch,distribution='github',now=()=>Date.now(),onChange=()=>{}}) {
  const sources=[{updateUrl:SCRIPT_UPDATE_URL,installUrl:SCRIPT_INSTALL_URL},
    {updateUrl:`${SCRIPT_CDN_ROOT}.meta.js`,installUrl:`${SCRIPT_CDN_ROOT}.user.js`}];
  if(distribution==='cdn')sources.reverse();
  const state={checking:false,available:null,installUrl:distribution==='cdn'?
    `${SCRIPT_CDN_ROOT.replace('@main',`@v${version}`)}.user.js`:SCRIPT_INSTALL_URL,message:`当前运行 v${version}，等待检查更新`};
  let attemptedAt=null;
  const newer=(a,b)=>a.split('.').map((n,i)=>Number(n)-Number(b.split('.')[i])).find(n=>n!==0)>0;
  async function check(manual=false) {
    const time=now();
    if(state.checking||(attemptedAt!==null&&time-attemptedAt<(manual?60000:3600000)))return state;
    attemptedAt=time;state.checking=true;onChange();
    try {
      let latest=null;
      for(const candidate of sources) {
        try {
          const response=await fetch(candidate.updateUrl,{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(10000)});
          if(!response.ok)throw new Error('update request failed');
          const metadata=await response.text();
          const remote=metadata.match(/^\/\/ @version[ \t]+([^\r\n]+)/m)?.[1].trim();
          const namespace=metadata.match(/^\/\/ @namespace[ \t]+([^\r\n]+)/m)?.[1].trim();
          if(metadata.length>8192||namespace!=='local.deepvein.balanced'||!/^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(remote??''))throw new Error('invalid update metadata');
          const pinned=`${SCRIPT_CDN_ROOT.replace('@main',`@v${remote}`)}.user.js`;
          const download=metadata.match(/^\/\/ @downloadURL[ \t]+([^\r\n]+)/m)?.[1].trim();
          const installUrl=candidate.installUrl===`${SCRIPT_CDN_ROOT}.user.js`&&download===pinned?pinned:candidate.installUrl;
          if(!latest||newer(remote,latest.version))latest={...candidate,installUrl,version:remote};
          // Both reachable sources must be compared: a cached upgrade may
          // still be several releases behind the other source.
        } catch { /* The other fixed delivery path may still be reachable. */ }
      }
      if(!latest)throw new Error('all update sources failed');
      if(newer(latest.version,state.available??version))state.available=latest.version;
      if(!newer(version,latest.version)&&(!state.available||latest.version===state.available))state.installUrl=latest.installUrl;
      state.message=state.available?`发现 v${state.available}；当前运行 v${version}。点击更新，安装后刷新游戏生效。`:
        `当前运行 v${version}，未发现更新；每小时自动检查。`;
    } catch {
      state.message=`检查更新失败，当前 v${version} 继续运行。`+(state.available?`已发现 v${state.available}，可点击更新后刷新游戏。`:'可稍后重试或通过油猴检查更新。');
    } finally {state.checking=false;onChange();}
    return state;
  }
  return {state,check};
}
