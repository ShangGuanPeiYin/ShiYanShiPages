export class GlobeLifecycle {
 constructor(onState,{setTimer=(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimer=id=>globalThis.clearTimeout(id)}={}){this.onState=onState;this.setTimer=setTimer;this.clearTimer=clearTimer;this.generation=0;this.state='idle';this.map=null;this.timer=null;this.destroyed=false;}
 valid(token){return token===this.generation&&!this.destroyed;}
 clear(){if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;const map=this.map;this.map=null;map?.remove();}
 start(){this.generation++;this.clear();this.destroyed=false;this.state='loading';this.onState(this.state);const token=this.generation;this.timer=this.setTimer(()=>this.fallback(token),12000);return token;}
 attach(token,map){if(!this.valid(token)||this.state!=='loading'){map.remove();return false;}this.map=map;return true;}
 ready(token){if(!this.valid(token)||this.state!=='loading')return false;if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;this.state='ready';this.onState(this.state);return true;}
 fallback(token){if(!this.valid(token))return;this.generation++;this.clear();this.state='fallback';this.onState(this.state);}
 dispose(){this.generation++;this.destroyed=true;this.clear();}
}
