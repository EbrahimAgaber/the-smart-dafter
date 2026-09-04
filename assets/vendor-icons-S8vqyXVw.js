var Qn=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function Zn(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var rt={exports:{}},S={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Tt;function le(){if(Tt)return S;Tt=1;var o=Symbol.for("react.transitional.element"),i=Symbol.for("react.portal"),s=Symbol.for("react.fragment"),e=Symbol.for("react.strict_mode"),t=Symbol.for("react.profiler"),n=Symbol.for("react.consumer"),a=Symbol.for("react.context"),u=Symbol.for("react.forward_ref"),c=Symbol.for("react.suspense"),h=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),N=Symbol.for("react.activity"),k=Symbol.iterator;function p(r){return r===null||typeof r!="object"?null:(r=k&&r[k]||r["@@iterator"],typeof r=="function"?r:null)}var P={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},I=Object.assign,H={};function E(r,l,T){this.props=r,this.context=l,this.refs=H,this.updater=T||P}E.prototype.isReactComponent={},E.prototype.setState=function(r,l){if(typeof r!="object"&&typeof r!="function"&&r!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,r,l,"setState")},E.prototype.forceUpdate=function(r){this.updater.enqueueForceUpdate(this,r,"forceUpdate")};function q(){}q.prototype=E.prototype;function A(r,l,T){this.props=r,this.context=l,this.refs=H,this.updater=T||P}var C=A.prototype=new q;C.constructor=A,I(C,E.prototype),C.isPureReactComponent=!0;var D=Array.isArray;function m(){}var f={H:null,A:null,T:null,S:null},M=Object.prototype.hasOwnProperty;function y(r,l,T){var b=T.ref;return{$$typeof:o,type:r,key:l,ref:b!==void 0?b:null,props:T}}function R(r,l){return y(r.type,l,r.props)}function w(r){return typeof r=="object"&&r!==null&&r.$$typeof===o}function v(r){var l={"=":"=0",":":"=2"};return"$"+r.replace(/[=:]/g,function(T){return l[T]})}var _=/\/+/g;function B(r,l){return typeof r=="object"&&r!==null&&r.key!=null?v(""+r.key):l.toString(36)}function V(r){switch(r.status){case"fulfilled":return r.value;case"rejected":throw r.reason;default:switch(typeof r.status=="string"?r.then(m,m):(r.status="pending",r.then(function(l){r.status==="pending"&&(r.status="fulfilled",r.value=l)},function(l){r.status==="pending"&&(r.status="rejected",r.reason=l)})),r.status){case"fulfilled":return r.value;case"rejected":throw r.reason}}throw r}function j(r,l,T,b,L){var x=typeof r;(x==="undefined"||x==="boolean")&&(r=null);var $=!1;if(r===null)$=!0;else switch(x){case"bigint":case"string":case"number":$=!0;break;case"object":switch(r.$$typeof){case o:case i:$=!0;break;case g:return $=r._init,j($(r._payload),l,T,b,L)}}if($)return L=L(r),$=b===""?"."+B(r,0):b,D(L)?(T="",$!=null&&(T=$.replace(_,"$&/")+"/"),j(L,l,T,"",function(Z){return Z})):L!=null&&(w(L)&&(L=R(L,T+(L.key==null||r&&r.key===L.key?"":(""+L.key).replace(_,"$&/")+"/")+$)),l.push(L)),1;$=0;var z=b===""?".":b+":";if(D(r))for(var U=0;U<r.length;U++)b=r[U],x=z+B(b,U),$+=j(b,l,T,x,L);else if(U=p(r),typeof U=="function")for(r=U.call(r),U=0;!(b=r.next()).done;)b=b.value,x=z+B(b,U++),$+=j(b,l,T,x,L);else if(x==="object"){if(typeof r.then=="function")return j(V(r),l,T,b,L);throw l=String(r),Error("Objects are not valid as a React child (found: "+(l==="[object Object]"?"object with keys {"+Object.keys(r).join(", ")+"}":l)+"). If you meant to render a collection of children, use an array instead.")}return $}function J(r,l,T){if(r==null)return r;var b=[],L=0;return j(r,b,"","",function(x){return l.call(T,x,L++)}),b}function tt(r){if(r._status===-1){var l=r._result;l=l(),l.then(function(T){(r._status===0||r._status===-1)&&(r._status=1,r._result=T)},function(T){(r._status===0||r._status===-1)&&(r._status=2,r._result=T)}),r._status===-1&&(r._status=0,r._result=l)}if(r._status===1)return r._result.default;throw r._result}var et=typeof reportError=="function"?reportError:function(r){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var l=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof r=="object"&&r!==null&&typeof r.message=="string"?String(r.message):String(r),error:r});if(!window.dispatchEvent(l))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",r);return}console.error(r)},Q={map:J,forEach:function(r,l,T){J(r,function(){l.apply(this,arguments)},T)},count:function(r){var l=0;return J(r,function(){l++}),l},toArray:function(r){return J(r,function(l){return l})||[]},only:function(r){if(!w(r))throw Error("React.Children.only expected to receive a single React element child.");return r}};return S.Activity=N,S.Children=Q,S.Component=E,S.Fragment=s,S.Profiler=t,S.PureComponent=A,S.StrictMode=e,S.Suspense=c,S.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=f,S.__COMPILER_RUNTIME={__proto__:null,c:function(r){return f.H.useMemoCache(r)}},S.cache=function(r){return function(){return r.apply(null,arguments)}},S.cacheSignal=function(){return null},S.cloneElement=function(r,l,T){if(r==null)throw Error("The argument must be a React element, but you passed "+r+".");var b=I({},r.props),L=r.key;if(l!=null)for(x in l.key!==void 0&&(L=""+l.key),l)!M.call(l,x)||x==="key"||x==="__self"||x==="__source"||x==="ref"&&l.ref===void 0||(b[x]=l[x]);var x=arguments.length-2;if(x===1)b.children=T;else if(1<x){for(var $=Array(x),z=0;z<x;z++)$[z]=arguments[z+2];b.children=$}return y(r.type,L,b)},S.createContext=function(r){return r={$$typeof:a,_currentValue:r,_currentValue2:r,_threadCount:0,Provider:null,Consumer:null},r.Provider=r,r.Consumer={$$typeof:n,_context:r},r},S.createElement=function(r,l,T){var b,L={},x=null;if(l!=null)for(b in l.key!==void 0&&(x=""+l.key),l)M.call(l,b)&&b!=="key"&&b!=="__self"&&b!=="__source"&&(L[b]=l[b]);var $=arguments.length-2;if($===1)L.children=T;else if(1<$){for(var z=Array($),U=0;U<$;U++)z[U]=arguments[U+2];L.children=z}if(r&&r.defaultProps)for(b in $=r.defaultProps,$)L[b]===void 0&&(L[b]=$[b]);return y(r,x,L)},S.createRef=function(){return{current:null}},S.forwardRef=function(r){return{$$typeof:u,render:r}},S.isValidElement=w,S.lazy=function(r){return{$$typeof:g,_payload:{_status:-1,_result:r},_init:tt}},S.memo=function(r,l){return{$$typeof:h,type:r,compare:l===void 0?null:l}},S.startTransition=function(r){var l=f.T,T={};f.T=T;try{var b=r(),L=f.S;L!==null&&L(T,b),typeof b=="object"&&b!==null&&typeof b.then=="function"&&b.then(m,et)}catch(x){et(x)}finally{l!==null&&T.types!==null&&(l.types=T.types),f.T=l}},S.unstable_useCacheRefresh=function(){return f.H.useCacheRefresh()},S.use=function(r){return f.H.use(r)},S.useActionState=function(r,l,T){return f.H.useActionState(r,l,T)},S.useCallback=function(r,l){return f.H.useCallback(r,l)},S.useContext=function(r){return f.H.useContext(r)},S.useDebugValue=function(){},S.useDeferredValue=function(r,l){return f.H.useDeferredValue(r,l)},S.useEffect=function(r,l){return f.H.useEffect(r,l)},S.useEffectEvent=function(r){return f.H.useEffectEvent(r)},S.useId=function(){return f.H.useId()},S.useImperativeHandle=function(r,l,T){return f.H.useImperativeHandle(r,l,T)},S.useInsertionEffect=function(r,l){return f.H.useInsertionEffect(r,l)},S.useLayoutEffect=function(r,l){return f.H.useLayoutEffect(r,l)},S.useMemo=function(r,l){return f.H.useMemo(r,l)},S.useOptimistic=function(r,l){return f.H.useOptimistic(r,l)},S.useReducer=function(r,l,T){return f.H.useReducer(r,l,T)},S.useRef=function(r){return f.H.useRef(r)},S.useState=function(r){return f.H.useState(r)},S.useSyncExternalStore=function(r,l,T){return f.H.useSyncExternalStore(r,l,T)},S.useTransition=function(){return f.H.useTransition()},S.version="19.2.8",S}var bt;function fe(){return bt||(bt=1,rt.exports=le()),rt.exports}var X=fe();/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=o=>o.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),he=o=>o.replace(/^([A-Z])|[\s-_]+(\w)/g,(i,s,e)=>e?e.toUpperCase():s.toLowerCase()),Bt=o=>{const i=he(o);return i.charAt(0).toUpperCase()+i.slice(1)},ie=(...o)=>o.filter((i,s,e)=>!!i&&i.trim()!==""&&e.indexOf(i)===s).join(" ").trim(),ye=o=>{for(const i in o)if(i.startsWith("aria-")||i==="role"||i==="title")return!0};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var ge={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=X.forwardRef(({color:o="currentColor",size:i=24,strokeWidth:s=2,absoluteStrokeWidth:e,className:t="",children:n,iconNode:a,...u},c)=>X.createElement("svg",{ref:c,...ge,width:i,height:i,stroke:o,strokeWidth:e?Number(s)*24/Number(i):s,className:ie("lucide",t),...!n&&!ye(u)&&{"aria-hidden":"true"},...u},[...a.map(([h,g])=>X.createElement(h,g)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(o,i)=>{const s=X.forwardRef(({className:e,...t},n)=>X.createElement(pe,{ref:n,iconNode:i,className:ie(`lucide-${de(Bt(o))}`,`lucide-${o}`,e),...t}));return s.displayName=Bt(o),s};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const me=[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]],Wn=d("arrow-down-left",me);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],Xn=d("arrow-left",we);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ke=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],tr=d("arrow-right",ke);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=[["path",{d:"m21 16-4 4-4-4",key:"f6ql7i"}],["path",{d:"M17 20V4",key:"1ejh1v"}],["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}]],er=d("arrow-up-down",_e);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],nr=d("arrow-up-right",Me);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=[["path",{d:"M3 5v14",key:"1nt18q"}],["path",{d:"M8 5v14",key:"1ybrkv"}],["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"M17 5v14",key:"ycjyhj"}],["path",{d:"M21 5v14",key:"nzette"}]],rr=d("barcode",Ee);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],or=d("building-2",ve);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],ir=d("calendar",Ce);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],sr=d("camera",Ne);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],ar=d("check",Ae);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],cr=d("chevron-left",Re);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],ur=d("chevron-right",Te);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],lr=d("circle-alert",be);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],fr=d("circle-check-big",Be);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],dr=d("circle-check",Se);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["path",{d:"M11 14h10",key:"1w8e9d"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1.344",key:"1e62lh"}],["path",{d:"m17 18 4-4-4-4",key:"z2g111"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113",key:"bjbb7m"}],["rect",{x:"8",y:"2",width:"8",height:"4",rx:"1",key:"ublpy"}]],hr=d("clipboard-paste",Pe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]],yr=d("coins",Ie);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=[["path",{d:"M16 2v2",key:"scm5qe"}],["path",{d:"M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2",key:"1waht3"}],["path",{d:"M8 2v2",key:"pbkmx"}],["circle",{cx:"12",cy:"11",r:"3",key:"itu57m"}],["rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",key:"12vinp"}]],gr=d("contact",qe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],pr=d("copy",Le);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],mr=d("database",$e);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],wr=d("download",xe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],kr=d("external-link",He);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],_r=d("eye-off",De);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Mr=d("eye",Ue);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]],Er=d("file-check-2",ze);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]],vr=d("file-spreadsheet",je);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],Cr=d("file-text",Ve);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],Nr=d("globe",Fe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]],Ar=d("key-round",Oe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],Rr=d("layout-dashboard",Ye);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],Tr=d("lock-open",Ke);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],br=d("lock",Je);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],Br=d("map-pin",Ge);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]],Sr=d("message-square",Qe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],Pr=d("monitor",Ze);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],Ir=d("package",We);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],qr=d("pen",Xe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],Lr=d("phone",tn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],$r=d("plus",en);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],xr=d("printer",nn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],Hr=d("qr-code",rn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],Dr=d("receipt",on);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],Ur=d("refresh-cw",sn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],zr=d("rotate-ccw",an);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],jr=d("save",cn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const un=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],Vr=d("search",un);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Fr=d("settings",ln);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],Or=d("share-2",fn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=[["path",{d:"M12 2v13",key:"1km8f5"}],["path",{d:"m16 6-4-4-4 4",key:"13yo43"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}]],Yr=d("share",dn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],Kr=d("shield-alert",hn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Jr=d("shield-check",yn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gn=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],Gr=d("shopping-bag",gn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pn=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],Qr=d("smartphone",pn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mn=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],Zr=d("sparkles",mn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],Wr=d("square-plus",wn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kn=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]],Xr=d("store",kn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _n=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],to=d("trash-2",_n);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],eo=d("trending-down",Mn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const En=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],no=d("trending-up",En);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vn=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],ro=d("truck",vn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cn=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],oo=d("upload",Cn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nn=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],io=d("user-plus",Nn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const An=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],so=d("user",An);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],ao=d("users",Rn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tn=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],co=d("x",Tn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bn=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],uo=d("zap",bn);var G={},ot,St;function Bn(){return St||(St=1,ot=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),ot}var it={},O={},Pt;function Y(){if(Pt)return O;Pt=1;let o;const i=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return O.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17},O.getSymbolTotalCodewords=function(e){return i[e]},O.getBCHDigit=function(s){let e=0;for(;s!==0;)e++,s>>>=1;return e},O.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');o=e},O.isKanjiModeEnabled=function(){return typeof o<"u"},O.toSJIS=function(e){return o(e)},O}var st={},It;function Rt(){return It||(It=1,(function(o){o.L={bit:1},o.M={bit:0},o.Q={bit:3},o.H={bit:2};function i(s){if(typeof s!="string")throw new Error("Param is not a string");switch(s.toLowerCase()){case"l":case"low":return o.L;case"m":case"medium":return o.M;case"q":case"quartile":return o.Q;case"h":case"high":return o.H;default:throw new Error("Unknown EC Level: "+s)}}o.isValid=function(e){return e&&typeof e.bit<"u"&&e.bit>=0&&e.bit<4},o.from=function(e,t){if(o.isValid(e))return e;try{return i(e)}catch{return t}}})(st)),st}var at,qt;function Sn(){if(qt)return at;qt=1;function o(){this.buffer=[],this.length=0}return o.prototype={get:function(i){const s=Math.floor(i/8);return(this.buffer[s]>>>7-i%8&1)===1},put:function(i,s){for(let e=0;e<s;e++)this.putBit((i>>>s-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(i){const s=Math.floor(this.length/8);this.buffer.length<=s&&this.buffer.push(0),i&&(this.buffer[s]|=128>>>this.length%8),this.length++}},at=o,at}var ct,Lt;function Pn(){if(Lt)return ct;Lt=1;function o(i){if(!i||i<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=i,this.data=new Uint8Array(i*i),this.reservedBit=new Uint8Array(i*i)}return o.prototype.set=function(i,s,e,t){const n=i*this.size+s;this.data[n]=e,t&&(this.reservedBit[n]=!0)},o.prototype.get=function(i,s){return this.data[i*this.size+s]},o.prototype.xor=function(i,s,e){this.data[i*this.size+s]^=e},o.prototype.isReserved=function(i,s){return this.reservedBit[i*this.size+s]},ct=o,ct}var ut={},$t;function In(){return $t||($t=1,(function(o){const i=Y().getSymbolSize;o.getRowColCoords=function(e){if(e===1)return[];const t=Math.floor(e/7)+2,n=i(e),a=n===145?26:Math.ceil((n-13)/(2*t-2))*2,u=[n-7];for(let c=1;c<t-1;c++)u[c]=u[c-1]-a;return u.push(6),u.reverse()},o.getPositions=function(e){const t=[],n=o.getRowColCoords(e),a=n.length;for(let u=0;u<a;u++)for(let c=0;c<a;c++)u===0&&c===0||u===0&&c===a-1||u===a-1&&c===0||t.push([n[u],n[c]]);return t}})(ut)),ut}var lt={},xt;function qn(){if(xt)return lt;xt=1;const o=Y().getSymbolSize,i=7;return lt.getPositions=function(e){const t=o(e);return[[0,0],[t-i,0],[0,t-i]]},lt}var ft={},Ht;function Ln(){return Ht||(Ht=1,(function(o){o.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const i={N1:3,N2:3,N3:40,N4:10};o.isValid=function(t){return t!=null&&t!==""&&!isNaN(t)&&t>=0&&t<=7},o.from=function(t){return o.isValid(t)?parseInt(t,10):void 0},o.getPenaltyN1=function(t){const n=t.size;let a=0,u=0,c=0,h=null,g=null;for(let N=0;N<n;N++){u=c=0,h=g=null;for(let k=0;k<n;k++){let p=t.get(N,k);p===h?u++:(u>=5&&(a+=i.N1+(u-5)),h=p,u=1),p=t.get(k,N),p===g?c++:(c>=5&&(a+=i.N1+(c-5)),g=p,c=1)}u>=5&&(a+=i.N1+(u-5)),c>=5&&(a+=i.N1+(c-5))}return a},o.getPenaltyN2=function(t){const n=t.size;let a=0;for(let u=0;u<n-1;u++)for(let c=0;c<n-1;c++){const h=t.get(u,c)+t.get(u,c+1)+t.get(u+1,c)+t.get(u+1,c+1);(h===4||h===0)&&a++}return a*i.N2},o.getPenaltyN3=function(t){const n=t.size;let a=0,u=0,c=0;for(let h=0;h<n;h++){u=c=0;for(let g=0;g<n;g++)u=u<<1&2047|t.get(h,g),g>=10&&(u===1488||u===93)&&a++,c=c<<1&2047|t.get(g,h),g>=10&&(c===1488||c===93)&&a++}return a*i.N3},o.getPenaltyN4=function(t){let n=0;const a=t.data.length;for(let c=0;c<a;c++)n+=t.data[c];return Math.abs(Math.ceil(n*100/a/5)-10)*i.N4};function s(e,t,n){switch(e){case o.Patterns.PATTERN000:return(t+n)%2===0;case o.Patterns.PATTERN001:return t%2===0;case o.Patterns.PATTERN010:return n%3===0;case o.Patterns.PATTERN011:return(t+n)%3===0;case o.Patterns.PATTERN100:return(Math.floor(t/2)+Math.floor(n/3))%2===0;case o.Patterns.PATTERN101:return t*n%2+t*n%3===0;case o.Patterns.PATTERN110:return(t*n%2+t*n%3)%2===0;case o.Patterns.PATTERN111:return(t*n%3+(t+n)%2)%2===0;default:throw new Error("bad maskPattern:"+e)}}o.applyMask=function(t,n){const a=n.size;for(let u=0;u<a;u++)for(let c=0;c<a;c++)n.isReserved(c,u)||n.xor(c,u,s(t,c,u))},o.getBestMask=function(t,n){const a=Object.keys(o.Patterns).length;let u=0,c=1/0;for(let h=0;h<a;h++){n(h),o.applyMask(h,t);const g=o.getPenaltyN1(t)+o.getPenaltyN2(t)+o.getPenaltyN3(t)+o.getPenaltyN4(t);o.applyMask(h,t),g<c&&(c=g,u=h)}return u}})(ft)),ft}var nt={},Dt;function se(){if(Dt)return nt;Dt=1;const o=Rt(),i=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],s=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return nt.getBlocksCount=function(t,n){switch(n){case o.L:return i[(t-1)*4+0];case o.M:return i[(t-1)*4+1];case o.Q:return i[(t-1)*4+2];case o.H:return i[(t-1)*4+3];default:return}},nt.getTotalCodewordsCount=function(t,n){switch(n){case o.L:return s[(t-1)*4+0];case o.M:return s[(t-1)*4+1];case o.Q:return s[(t-1)*4+2];case o.H:return s[(t-1)*4+3];default:return}},nt}var dt={},W={},Ut;function $n(){if(Ut)return W;Ut=1;const o=new Uint8Array(512),i=new Uint8Array(256);return(function(){let e=1;for(let t=0;t<255;t++)o[t]=e,i[e]=t,e<<=1,e&256&&(e^=285);for(let t=255;t<512;t++)o[t]=o[t-255]})(),W.log=function(e){if(e<1)throw new Error("log("+e+")");return i[e]},W.exp=function(e){return o[e]},W.mul=function(e,t){return e===0||t===0?0:o[i[e]+i[t]]},W}var zt;function xn(){return zt||(zt=1,(function(o){const i=$n();o.mul=function(e,t){const n=new Uint8Array(e.length+t.length-1);for(let a=0;a<e.length;a++)for(let u=0;u<t.length;u++)n[a+u]^=i.mul(e[a],t[u]);return n},o.mod=function(e,t){let n=new Uint8Array(e);for(;n.length-t.length>=0;){const a=n[0];for(let c=0;c<t.length;c++)n[c]^=i.mul(t[c],a);let u=0;for(;u<n.length&&n[u]===0;)u++;n=n.slice(u)}return n},o.generateECPolynomial=function(e){let t=new Uint8Array([1]);for(let n=0;n<e;n++)t=o.mul(t,new Uint8Array([1,i.exp(n)]));return t}})(dt)),dt}var ht,jt;function Hn(){if(jt)return ht;jt=1;const o=xn();function i(s){this.genPoly=void 0,this.degree=s,this.degree&&this.initialize(this.degree)}return i.prototype.initialize=function(e){this.degree=e,this.genPoly=o.generateECPolynomial(this.degree)},i.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const t=new Uint8Array(e.length+this.degree);t.set(e);const n=o.mod(t,this.genPoly),a=this.degree-n.length;if(a>0){const u=new Uint8Array(this.degree);return u.set(n,a),u}return n},ht=i,ht}var yt={},gt={},pt={},Vt;function ae(){return Vt||(Vt=1,pt.isValid=function(i){return!isNaN(i)&&i>=1&&i<=40}),pt}var F={},Ft;function ce(){if(Ft)return F;Ft=1;const o="[0-9]+",i="[A-Z $%*+\\-./:]+";let s="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";s=s.replace(/u/g,"\\u");const e="(?:(?![A-Z0-9 $%*+\\-./:]|"+s+`)(?:.|[\r
]))+`;F.KANJI=new RegExp(s,"g"),F.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),F.BYTE=new RegExp(e,"g"),F.NUMERIC=new RegExp(o,"g"),F.ALPHANUMERIC=new RegExp(i,"g");const t=new RegExp("^"+s+"$"),n=new RegExp("^"+o+"$"),a=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return F.testKanji=function(c){return t.test(c)},F.testNumeric=function(c){return n.test(c)},F.testAlphanumeric=function(c){return a.test(c)},F}var Ot;function K(){return Ot||(Ot=1,(function(o){const i=ae(),s=ce();o.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},o.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},o.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},o.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},o.MIXED={bit:-1},o.getCharCountIndicator=function(n,a){if(!n.ccBits)throw new Error("Invalid mode: "+n);if(!i.isValid(a))throw new Error("Invalid version: "+a);return a>=1&&a<10?n.ccBits[0]:a<27?n.ccBits[1]:n.ccBits[2]},o.getBestModeForData=function(n){return s.testNumeric(n)?o.NUMERIC:s.testAlphanumeric(n)?o.ALPHANUMERIC:s.testKanji(n)?o.KANJI:o.BYTE},o.toString=function(n){if(n&&n.id)return n.id;throw new Error("Invalid mode")},o.isValid=function(n){return n&&n.bit&&n.ccBits};function e(t){if(typeof t!="string")throw new Error("Param is not a string");switch(t.toLowerCase()){case"numeric":return o.NUMERIC;case"alphanumeric":return o.ALPHANUMERIC;case"kanji":return o.KANJI;case"byte":return o.BYTE;default:throw new Error("Unknown mode: "+t)}}o.from=function(n,a){if(o.isValid(n))return n;try{return e(n)}catch{return a}}})(gt)),gt}var Yt;function Dn(){return Yt||(Yt=1,(function(o){const i=Y(),s=se(),e=Rt(),t=K(),n=ae(),a=7973,u=i.getBCHDigit(a);function c(k,p,P){for(let I=1;I<=40;I++)if(p<=o.getCapacity(I,P,k))return I}function h(k,p){return t.getCharCountIndicator(k,p)+4}function g(k,p){let P=0;return k.forEach(function(I){const H=h(I.mode,p);P+=H+I.getBitsLength()}),P}function N(k,p){for(let P=1;P<=40;P++)if(g(k,P)<=o.getCapacity(P,p,t.MIXED))return P}o.from=function(p,P){return n.isValid(p)?parseInt(p,10):P},o.getCapacity=function(p,P,I){if(!n.isValid(p))throw new Error("Invalid QR Code version");typeof I>"u"&&(I=t.BYTE);const H=i.getSymbolTotalCodewords(p),E=s.getTotalCodewordsCount(p,P),q=(H-E)*8;if(I===t.MIXED)return q;const A=q-h(I,p);switch(I){case t.NUMERIC:return Math.floor(A/10*3);case t.ALPHANUMERIC:return Math.floor(A/11*2);case t.KANJI:return Math.floor(A/13);case t.BYTE:default:return Math.floor(A/8)}},o.getBestVersionForData=function(p,P){let I;const H=e.from(P,e.M);if(Array.isArray(p)){if(p.length>1)return N(p,H);if(p.length===0)return 1;I=p[0]}else I=p;return c(I.mode,I.getLength(),H)},o.getEncodedBits=function(p){if(!n.isValid(p)||p<7)throw new Error("Invalid QR Code version");let P=p<<12;for(;i.getBCHDigit(P)-u>=0;)P^=a<<i.getBCHDigit(P)-u;return p<<12|P}})(yt)),yt}var mt={},Kt;function Un(){if(Kt)return mt;Kt=1;const o=Y(),i=1335,s=21522,e=o.getBCHDigit(i);return mt.getEncodedBits=function(n,a){const u=n.bit<<3|a;let c=u<<10;for(;o.getBCHDigit(c)-e>=0;)c^=i<<o.getBCHDigit(c)-e;return(u<<10|c)^s},mt}var wt={},kt,Jt;function zn(){if(Jt)return kt;Jt=1;const o=K();function i(s){this.mode=o.NUMERIC,this.data=s.toString()}return i.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t,n,a;for(t=0;t+3<=this.data.length;t+=3)n=this.data.substr(t,3),a=parseInt(n,10),e.put(a,10);const u=this.data.length-t;u>0&&(n=this.data.substr(t),a=parseInt(n,10),e.put(a,u*3+1))},kt=i,kt}var _t,Gt;function jn(){if(Gt)return _t;Gt=1;const o=K(),i=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function s(e){this.mode=o.ALPHANUMERIC,this.data=e}return s.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)},s.prototype.getLength=function(){return this.data.length},s.prototype.getBitsLength=function(){return s.getBitsLength(this.data.length)},s.prototype.write=function(t){let n;for(n=0;n+2<=this.data.length;n+=2){let a=i.indexOf(this.data[n])*45;a+=i.indexOf(this.data[n+1]),t.put(a,11)}this.data.length%2&&t.put(i.indexOf(this.data[n]),6)},_t=s,_t}var Mt,Qt;function Vn(){if(Qt)return Mt;Qt=1;const o=K();function i(s){this.mode=o.BYTE,typeof s=="string"?this.data=new TextEncoder().encode(s):this.data=new Uint8Array(s)}return i.getBitsLength=function(e){return e*8},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(s){for(let e=0,t=this.data.length;e<t;e++)s.put(this.data[e],8)},Mt=i,Mt}var Et,Zt;function Fn(){if(Zt)return Et;Zt=1;const o=K(),i=Y();function s(e){this.mode=o.KANJI,this.data=e}return s.getBitsLength=function(t){return t*13},s.prototype.getLength=function(){return this.data.length},s.prototype.getBitsLength=function(){return s.getBitsLength(this.data.length)},s.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let n=i.toSJIS(this.data[t]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);n=(n>>>8&255)*192+(n&255),e.put(n,13)}},Et=s,Et}var vt={exports:{}},Wt;function On(){return Wt||(Wt=1,(function(o){var i={single_source_shortest_paths:function(s,e,t){var n={},a={};a[e]=0;var u=i.PriorityQueue.make();u.push(e,0);for(var c,h,g,N,k,p,P,I,H;!u.empty();){c=u.pop(),h=c.value,N=c.cost,k=s[h]||{};for(g in k)k.hasOwnProperty(g)&&(p=k[g],P=N+p,I=a[g],H=typeof a[g]>"u",(H||I>P)&&(a[g]=P,u.push(g,P),n[g]=h))}if(typeof t<"u"&&typeof a[t]>"u"){var E=["Could not find a path from ",e," to ",t,"."].join("");throw new Error(E)}return n},extract_shortest_path_from_predecessor_list:function(s,e){for(var t=[],n=e;n;)t.push(n),s[n],n=s[n];return t.reverse(),t},find_path:function(s,e,t){var n=i.single_source_shortest_paths(s,e,t);return i.extract_shortest_path_from_predecessor_list(n,t)},PriorityQueue:{make:function(s){var e=i.PriorityQueue,t={},n;s=s||{};for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t.queue=[],t.sorter=s.sorter||e.default_sorter,t},default_sorter:function(s,e){return s.cost-e.cost},push:function(s,e){var t={value:s,cost:e};this.queue.push(t),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};o.exports=i})(vt)),vt.exports}var Xt;function Yn(){return Xt||(Xt=1,(function(o){const i=K(),s=zn(),e=jn(),t=Vn(),n=Fn(),a=ce(),u=Y(),c=On();function h(E){return unescape(encodeURIComponent(E)).length}function g(E,q,A){const C=[];let D;for(;(D=E.exec(A))!==null;)C.push({data:D[0],index:D.index,mode:q,length:D[0].length});return C}function N(E){const q=g(a.NUMERIC,i.NUMERIC,E),A=g(a.ALPHANUMERIC,i.ALPHANUMERIC,E);let C,D;return u.isKanjiModeEnabled()?(C=g(a.BYTE,i.BYTE,E),D=g(a.KANJI,i.KANJI,E)):(C=g(a.BYTE_KANJI,i.BYTE,E),D=[]),q.concat(A,C,D).sort(function(f,M){return f.index-M.index}).map(function(f){return{data:f.data,mode:f.mode,length:f.length}})}function k(E,q){switch(q){case i.NUMERIC:return s.getBitsLength(E);case i.ALPHANUMERIC:return e.getBitsLength(E);case i.KANJI:return n.getBitsLength(E);case i.BYTE:return t.getBitsLength(E)}}function p(E){return E.reduce(function(q,A){const C=q.length-1>=0?q[q.length-1]:null;return C&&C.mode===A.mode?(q[q.length-1].data+=A.data,q):(q.push(A),q)},[])}function P(E){const q=[];for(let A=0;A<E.length;A++){const C=E[A];switch(C.mode){case i.NUMERIC:q.push([C,{data:C.data,mode:i.ALPHANUMERIC,length:C.length},{data:C.data,mode:i.BYTE,length:C.length}]);break;case i.ALPHANUMERIC:q.push([C,{data:C.data,mode:i.BYTE,length:C.length}]);break;case i.KANJI:q.push([C,{data:C.data,mode:i.BYTE,length:h(C.data)}]);break;case i.BYTE:q.push([{data:C.data,mode:i.BYTE,length:h(C.data)}])}}return q}function I(E,q){const A={},C={start:{}};let D=["start"];for(let m=0;m<E.length;m++){const f=E[m],M=[];for(let y=0;y<f.length;y++){const R=f[y],w=""+m+y;M.push(w),A[w]={node:R,lastCount:0},C[w]={};for(let v=0;v<D.length;v++){const _=D[v];A[_]&&A[_].node.mode===R.mode?(C[_][w]=k(A[_].lastCount+R.length,R.mode)-k(A[_].lastCount,R.mode),A[_].lastCount+=R.length):(A[_]&&(A[_].lastCount=R.length),C[_][w]=k(R.length,R.mode)+4+i.getCharCountIndicator(R.mode,q))}}D=M}for(let m=0;m<D.length;m++)C[D[m]].end=0;return{map:C,table:A}}function H(E,q){let A;const C=i.getBestModeForData(E);if(A=i.from(q,C),A!==i.BYTE&&A.bit<C.bit)throw new Error('"'+E+'" cannot be encoded with mode '+i.toString(A)+`.
 Suggested mode is: `+i.toString(C));switch(A===i.KANJI&&!u.isKanjiModeEnabled()&&(A=i.BYTE),A){case i.NUMERIC:return new s(E);case i.ALPHANUMERIC:return new e(E);case i.KANJI:return new n(E);case i.BYTE:return new t(E)}}o.fromArray=function(q){return q.reduce(function(A,C){return typeof C=="string"?A.push(H(C,null)):C.data&&A.push(H(C.data,C.mode)),A},[])},o.fromString=function(q,A){const C=N(q,u.isKanjiModeEnabled()),D=P(C),m=I(D,A),f=c.find_path(m.map,"start","end"),M=[];for(let y=1;y<f.length-1;y++)M.push(m.table[f[y]].node);return o.fromArray(p(M))},o.rawSplit=function(q){return o.fromArray(N(q,u.isKanjiModeEnabled()))}})(wt)),wt}var te;function Kn(){if(te)return it;te=1;const o=Y(),i=Rt(),s=Sn(),e=Pn(),t=In(),n=qn(),a=Ln(),u=se(),c=Hn(),h=Dn(),g=Un(),N=K(),k=Yn();function p(m,f){const M=m.size,y=n.getPositions(f);for(let R=0;R<y.length;R++){const w=y[R][0],v=y[R][1];for(let _=-1;_<=7;_++)if(!(w+_<=-1||M<=w+_))for(let B=-1;B<=7;B++)v+B<=-1||M<=v+B||(_>=0&&_<=6&&(B===0||B===6)||B>=0&&B<=6&&(_===0||_===6)||_>=2&&_<=4&&B>=2&&B<=4?m.set(w+_,v+B,!0,!0):m.set(w+_,v+B,!1,!0))}}function P(m){const f=m.size;for(let M=8;M<f-8;M++){const y=M%2===0;m.set(M,6,y,!0),m.set(6,M,y,!0)}}function I(m,f){const M=t.getPositions(f);for(let y=0;y<M.length;y++){const R=M[y][0],w=M[y][1];for(let v=-2;v<=2;v++)for(let _=-2;_<=2;_++)v===-2||v===2||_===-2||_===2||v===0&&_===0?m.set(R+v,w+_,!0,!0):m.set(R+v,w+_,!1,!0)}}function H(m,f){const M=m.size,y=h.getEncodedBits(f);let R,w,v;for(let _=0;_<18;_++)R=Math.floor(_/3),w=_%3+M-8-3,v=(y>>_&1)===1,m.set(R,w,v,!0),m.set(w,R,v,!0)}function E(m,f,M){const y=m.size,R=g.getEncodedBits(f,M);let w,v;for(w=0;w<15;w++)v=(R>>w&1)===1,w<6?m.set(w,8,v,!0):w<8?m.set(w+1,8,v,!0):m.set(y-15+w,8,v,!0),w<8?m.set(8,y-w-1,v,!0):w<9?m.set(8,15-w-1+1,v,!0):m.set(8,15-w-1,v,!0);m.set(y-8,8,1,!0)}function q(m,f){const M=m.size;let y=-1,R=M-1,w=7,v=0;for(let _=M-1;_>0;_-=2)for(_===6&&_--;;){for(let B=0;B<2;B++)if(!m.isReserved(R,_-B)){let V=!1;v<f.length&&(V=(f[v]>>>w&1)===1),m.set(R,_-B,V),w--,w===-1&&(v++,w=7)}if(R+=y,R<0||M<=R){R-=y,y=-y;break}}}function A(m,f,M){const y=new s;M.forEach(function(B){y.put(B.mode.bit,4),y.put(B.getLength(),N.getCharCountIndicator(B.mode,m)),B.write(y)});const R=o.getSymbolTotalCodewords(m),w=u.getTotalCodewordsCount(m,f),v=(R-w)*8;for(y.getLengthInBits()+4<=v&&y.put(0,4);y.getLengthInBits()%8!==0;)y.putBit(0);const _=(v-y.getLengthInBits())/8;for(let B=0;B<_;B++)y.put(B%2?17:236,8);return C(y,m,f)}function C(m,f,M){const y=o.getSymbolTotalCodewords(f),R=u.getTotalCodewordsCount(f,M),w=y-R,v=u.getBlocksCount(f,M),_=y%v,B=v-_,V=Math.floor(y/v),j=Math.floor(w/v),J=j+1,tt=V-j,et=new c(tt);let Q=0;const r=new Array(v),l=new Array(v);let T=0;const b=new Uint8Array(m.buffer);for(let U=0;U<v;U++){const Z=U<B?j:J;r[U]=b.slice(Q,Q+Z),l[U]=et.encode(r[U]),Q+=Z,T=Math.max(T,Z)}const L=new Uint8Array(y);let x=0,$,z;for($=0;$<T;$++)for(z=0;z<v;z++)$<r[z].length&&(L[x++]=r[z][$]);for($=0;$<tt;$++)for(z=0;z<v;z++)L[x++]=l[z][$];return L}function D(m,f,M,y){let R;if(Array.isArray(m))R=k.fromArray(m);else if(typeof m=="string"){let V=f;if(!V){const j=k.rawSplit(m);V=h.getBestVersionForData(j,M)}R=k.fromString(m,V||40)}else throw new Error("Invalid data");const w=h.getBestVersionForData(R,M);if(!w)throw new Error("The amount of data is too big to be stored in a QR Code");if(!f)f=w;else if(f<w)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+w+`.
`);const v=A(f,M,R),_=o.getSymbolSize(f),B=new e(_);return p(B,f),P(B),I(B,f),E(B,M,0),f>=7&&H(B,f),q(B,v),isNaN(y)&&(y=a.getBestMask(B,E.bind(null,B,M))),a.applyMask(y,B),E(B,M,y),{modules:B,version:f,errorCorrectionLevel:M,maskPattern:y,segments:R}}return it.create=function(f,M){if(typeof f>"u"||f==="")throw new Error("No input text");let y=i.M,R,w;return typeof M<"u"&&(y=i.from(M.errorCorrectionLevel,i.M),R=h.from(M.version),w=a.from(M.maskPattern),M.toSJISFunc&&o.setToSJISFunction(M.toSJISFunc)),D(f,R,y,w)},it}var Ct={},Nt={},ee;function ue(){return ee||(ee=1,(function(o){function i(s){if(typeof s=="number"&&(s=s.toString()),typeof s!="string")throw new Error("Color should be defined as hex string");let e=s.slice().replace("#","").split("");if(e.length<3||e.length===5||e.length>8)throw new Error("Invalid hex color: "+s);(e.length===3||e.length===4)&&(e=Array.prototype.concat.apply([],e.map(function(n){return[n,n]}))),e.length===6&&e.push("F","F");const t=parseInt(e.join(""),16);return{r:t>>24&255,g:t>>16&255,b:t>>8&255,a:t&255,hex:"#"+e.slice(0,6).join("")}}o.getOptions=function(e){e||(e={}),e.color||(e.color={});const t=typeof e.margin>"u"||e.margin===null||e.margin<0?4:e.margin,n=e.width&&e.width>=21?e.width:void 0,a=e.scale||4;return{width:n,scale:n?4:a,margin:t,color:{dark:i(e.color.dark||"#000000ff"),light:i(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},o.getScale=function(e,t){return t.width&&t.width>=e+t.margin*2?t.width/(e+t.margin*2):t.scale},o.getImageWidth=function(e,t){const n=o.getScale(e,t);return Math.floor((e+t.margin*2)*n)},o.qrToImageData=function(e,t,n){const a=t.modules.size,u=t.modules.data,c=o.getScale(a,n),h=Math.floor((a+n.margin*2)*c),g=n.margin*c,N=[n.color.light,n.color.dark];for(let k=0;k<h;k++)for(let p=0;p<h;p++){let P=(k*h+p)*4,I=n.color.light;if(k>=g&&p>=g&&k<h-g&&p<h-g){const H=Math.floor((k-g)/c),E=Math.floor((p-g)/c);I=N[u[H*a+E]?1:0]}e[P++]=I.r,e[P++]=I.g,e[P++]=I.b,e[P]=I.a}}})(Nt)),Nt}var ne;function Jn(){return ne||(ne=1,(function(o){const i=ue();function s(t,n,a){t.clearRect(0,0,n.width,n.height),n.style||(n.style={}),n.height=a,n.width=a,n.style.height=a+"px",n.style.width=a+"px"}function e(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}o.render=function(n,a,u){let c=u,h=a;typeof c>"u"&&(!a||!a.getContext)&&(c=a,a=void 0),a||(h=e()),c=i.getOptions(c);const g=i.getImageWidth(n.modules.size,c),N=h.getContext("2d"),k=N.createImageData(g,g);return i.qrToImageData(k.data,n,c),s(N,h,g),N.putImageData(k,0,0),h},o.renderToDataURL=function(n,a,u){let c=u;typeof c>"u"&&(!a||!a.getContext)&&(c=a,a=void 0),c||(c={});const h=o.render(n,a,c),g=c.type||"image/png",N=c.rendererOpts||{};return h.toDataURL(g,N.quality)}})(Ct)),Ct}var At={},re;function Gn(){if(re)return At;re=1;const o=ue();function i(t,n){const a=t.a/255,u=n+'="'+t.hex+'"';return a<1?u+" "+n+'-opacity="'+a.toFixed(2).slice(1)+'"':u}function s(t,n,a){let u=t+n;return typeof a<"u"&&(u+=" "+a),u}function e(t,n,a){let u="",c=0,h=!1,g=0;for(let N=0;N<t.length;N++){const k=Math.floor(N%n),p=Math.floor(N/n);!k&&!h&&(h=!0),t[N]?(g++,N>0&&k>0&&t[N-1]||(u+=h?s("M",k+a,.5+p+a):s("m",c,0),c=0,h=!1),k+1<n&&t[N+1]||(u+=s("h",g),g=0)):c++}return u}return At.render=function(n,a,u){const c=o.getOptions(a),h=n.modules.size,g=n.modules.data,N=h+c.margin*2,k=c.color.light.a?"<path "+i(c.color.light,"fill")+' d="M0 0h'+N+"v"+N+'H0z"/>':"",p="<path "+i(c.color.dark,"stroke")+' d="'+e(g,h,c.margin)+'"/>',P='viewBox="0 0 '+N+" "+N+'"',H='<svg xmlns="http://www.w3.org/2000/svg" '+(c.width?'width="'+c.width+'" height="'+c.width+'" ':"")+P+' shape-rendering="crispEdges">'+k+p+`</svg>
`;return typeof u=="function"&&u(null,H),H},At}var oe;function lo(){if(oe)return G;oe=1;const o=Bn(),i=Kn(),s=Jn(),e=Gn();function t(n,a,u,c,h){const g=[].slice.call(arguments,1),N=g.length,k=typeof g[N-1]=="function";if(!k&&!o())throw new Error("Callback required as last argument");if(k){if(N<2)throw new Error("Too few arguments provided");N===2?(h=u,u=a,a=c=void 0):N===3&&(a.getContext&&typeof h>"u"?(h=c,c=void 0):(h=c,c=u,u=a,a=void 0))}else{if(N<1)throw new Error("Too few arguments provided");return N===1?(u=a,a=c=void 0):N===2&&!a.getContext&&(c=u,u=a,a=void 0),new Promise(function(p,P){try{const I=i.create(u,c);p(n(I,a,c))}catch(I){P(I)}})}try{const p=i.create(u,c);h(null,n(p,a,c))}catch(p){h(p)}}return G.create=i.create,G.toCanvas=t.bind(null,s.render),G.toDataURL=t.bind(null,s.renderToDataURL),G.toString=t.bind(null,function(n,a,u){return e.render(n,u)}),G}export{Or as $,Wn as A,$r as B,ir as C,sr as D,rr as E,vr as F,Nr as G,ar as H,or as I,jr as J,mr as K,Rr as L,Pr as M,wr as N,oo as O,Ir as P,Hr as Q,Dr as R,Qr as S,no as T,ao as U,Xr as V,Jr as W,co as X,Kr as Y,Ar as Z,Ur as _,X as a,pr as a0,Yr as a1,Wr as a2,br as a3,hr as a4,xr as a5,fr as a6,kr as a7,Zn as a8,lo as a9,so as aa,Er as ab,Tr as ac,_r as ad,Mr as ae,uo as af,Qn as ag,Fr as b,eo as c,yr as d,Zr as e,Gr as f,ro as g,nr as h,Br as i,cr as j,ur as k,gr as l,io as m,Vr as n,er as o,zr as p,lr as q,fe as r,dr as s,Lr as t,Sr as u,qr as v,to as w,tr as x,Xn as y,Cr as z};
