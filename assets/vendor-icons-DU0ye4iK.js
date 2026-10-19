var ur=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function lr(o){return o&&o.__esModule&&Object.prototype.hasOwnProperty.call(o,"default")?o.default:o}var it={exports:{}},T={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var St;function fe(){if(St)return T;St=1;var o=Symbol.for("react.transitional.element"),i=Symbol.for("react.portal"),a=Symbol.for("react.fragment"),e=Symbol.for("react.strict_mode"),t=Symbol.for("react.profiler"),n=Symbol.for("react.consumer"),s=Symbol.for("react.context"),u=Symbol.for("react.forward_ref"),c=Symbol.for("react.suspense"),f=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),R=Symbol.for("react.activity"),_=Symbol.for("react.view_transition"),y=Symbol.iterator;function I(r){return r===null||typeof r!="object"?null:(r=y&&r[y]||r["@@iterator"],typeof r=="function"?r:null)}var x={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},H=Object.assign,B={};function P(r,l,w){this.props=r,this.context=l,this.refs=B,this.updater=w||x}P.prototype.isReactComponent={},P.prototype.setState=function(r,l){if(typeof r!="object"&&typeof r!="function"&&r!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,r,l,"setState")},P.prototype.forceUpdate=function(r){this.updater.enqueueForceUpdate(this,r,"forceUpdate")};function S(){}S.prototype=P.prototype;function N(r,l,w){this.props=r,this.context=l,this.refs=B,this.updater=w||x}var D=N.prototype=new S;D.constructor=N,H(D,P.prototype),D.isPureReactComponent=!0;var m=Array.isArray;function M(){}var h={H:null,A:null,T:null,S:null},p=Object.prototype.hasOwnProperty;function A(r,l,w){var k=w.ref;return{$$typeof:o,type:r,key:l,ref:k!==void 0?k:null,props:w}}function v(r,l){return A(r.type,l,r.props)}function C(r){return typeof r=="object"&&r!==null&&r.$$typeof===o}function E(r){var l={"=":"=0",":":"=2"};return"$"+r.replace(/[=:]/g,function(w){return l[w]})}var b=/\/+/g;function U(r,l){return typeof r=="object"&&r!==null&&r.key!=null?E(""+r.key):l.toString(36)}function Y(r){switch(r.status){case"fulfilled":return r.value;case"rejected":throw r.reason;default:switch(typeof r.status=="string"?r.then(M,M):(r.status="pending",r.then(function(l){r.status==="pending"&&(r.status="fulfilled",r.value=l)},function(l){r.status==="pending"&&(r.status="rejected",r.reason=l)})),r.status){case"fulfilled":return r.value;case"rejected":throw r.reason}}throw r}function F(r,l,w,k,q){var L=typeof r;(L==="undefined"||L==="boolean")&&(r=null);var $=!1;if(r===null)$=!0;else switch(L){case"bigint":case"string":case"number":$=!0;break;case"object":switch(r.$$typeof){case o:case i:$=!0;break;case g:return $=r._init,F($(r._payload),l,w,k,q)}}if($)return q=q(r),$=k===""?"."+U(r,0):k,m(q)?(w="",$!=null&&(w=$.replace(b,"$&/")+"/"),F(q,l,w,"",function(he){return he})):q!=null&&(C(q)&&(q=v(q,w+(q.key==null||r&&r.key===q.key?"":(""+q.key).replace(b,"$&/")+"/")+$)),l.push(q)),1;$=0;var j=k===""?".":k+":";if(m(r))for(var z=0;z<r.length;z++)k=r[z],L=j+U(k,z),$+=F(k,l,w,L,q);else if(z=I(r),typeof z=="function")for(r=z.call(r),z=0;!(k=r.next()).done;)k=k.value,L=j+U(k,z++),$+=F(k,l,w,L,q);else if(L==="object"){if(typeof r.then=="function")return F(Y(r),l,w,k,q);throw l=String(r),Error("Objects are not valid as a React child (found: "+(l==="[object Object]"?"object with keys {"+Object.keys(r).join(", ")+"}":l)+"). If you meant to render a collection of children, use an array instead.")}return $}function K(r,l,w){if(r==null)return r;var k=[],q=0;return F(r,k,"","",function(L){return l.call(w,L,q++)}),k}function ot(r){if(r._status===-1){var l=r._result,w=l();w.then(function(k){(r._status===0||r._status===-1)&&(r._status=1,r._result=k,w.status===void 0&&(w.status="fulfilled",w.value=k))},function(k){(r._status===0||r._status===-1)&&(r._status=2,r._result=k,w.status===void 0&&(w.status="rejected",w.reason=k))}),r._status===-1&&(r._status=0,r._result=w)}if(r._status===1)return r._result.default;throw r._result}var Z=typeof reportError=="function"?reportError:function(r){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var l=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof r=="object"&&r!==null&&typeof r.message=="string"?String(r.message):String(r),error:r});if(!window.dispatchEvent(l))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",r);return}console.error(r)};function J(r){var l=h.T,w={};w.types=l!==null?l.types:null,h.T=w;try{var k=r(),q=h.S;q!==null&&q(w,k),typeof k=="object"&&k!==null&&typeof k.then=="function"&&k.then(M,Z)}catch(L){Z(L)}finally{l!==null&&w.types!==null&&(l.types=w.types),h.T=l}}function X(r){var l=h.T;if(l!==null){var w=l.types;w===null?l.types=[r]:w.indexOf(r)===-1&&w.push(r)}else J(X.bind(null,r))}var tt={map:K,forEach:function(r,l,w){K(r,function(){l.apply(this,arguments)},w)},count:function(r){var l=0;return K(r,function(){l++}),l},toArray:function(r){return K(r,function(l){return l})||[]},only:function(r){if(!C(r))throw Error("React.Children.only expected to receive a single React element child.");return r}};return T.Activity=R,T.Children=tt,T.Component=P,T.Fragment=a,T.Profiler=t,T.PureComponent=N,T.StrictMode=e,T.Suspense=c,T.ViewTransition=_,T.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=h,T.__COMPILER_RUNTIME={__proto__:null,c:function(r){return h.H.useMemoCache(r)}},T.addTransitionType=X,T.cache=function(r){return function(){return r.apply(null,arguments)}},T.cacheSignal=function(){return null},T.cloneElement=function(r,l,w){if(r==null)throw Error("The argument must be a React element, but you passed "+r+".");var k=H({},r.props),q=r.key;if(l!=null)for(L in l.key!==void 0&&(q=""+l.key),l)!p.call(l,L)||L==="key"||L==="__self"||L==="__source"||L==="ref"&&l.ref===void 0||(k[L]=l[L]);var L=arguments.length-2;if(L===1)k.children=w;else if(1<L){for(var $=Array(L),j=0;j<L;j++)$[j]=arguments[j+2];k.children=$}return A(r.type,q,k)},T.createContext=function(r){return r={$$typeof:s,_currentValue:r,_currentValue2:r,_threadCount:0,Provider:null,Consumer:null},r.Provider=r,r.Consumer={$$typeof:n,_context:r},r},T.createElement=function(r,l,w){var k,q={},L=null;if(l!=null)for(k in l.key!==void 0&&(L=""+l.key),l)p.call(l,k)&&k!=="key"&&k!=="__self"&&k!=="__source"&&(q[k]=l[k]);var $=arguments.length-2;if($===1)q.children=w;else if(1<$){for(var j=Array($),z=0;z<$;z++)j[z]=arguments[z+2];q.children=j}if(r&&r.defaultProps)for(k in $=r.defaultProps,$)q[k]===void 0&&(q[k]=$[k]);return A(r,L,q)},T.createRef=function(){return{current:null}},T.forwardRef=function(r){return{$$typeof:u,render:r}},T.isValidElement=C,T.lazy=function(r){return{$$typeof:g,_payload:{_status:-1,_result:r},_init:ot}},T.memo=function(r,l){return{$$typeof:f,type:r,compare:l===void 0?null:l}},T.startTransition=J,T.unstable_useCacheRefresh=function(){return h.H.useCacheRefresh()},T.use=function(r){return h.H.use(r)},T.useActionState=function(r,l,w){return h.H.useActionState(r,l,w)},T.useCallback=function(r,l){return h.H.useCallback(r,l)},T.useContext=function(r){return h.H.useContext(r)},T.useDebugValue=function(){},T.useDeferredValue=function(r,l){return h.H.useDeferredValue(r,l)},T.useEffect=function(r,l){return h.H.useEffect(r,l)},T.useEffectEvent=function(r){return h.H.useEffectEvent(r)},T.useId=function(){return h.H.useId()},T.useImperativeHandle=function(r,l,w){return h.H.useImperativeHandle(r,l,w)},T.useInsertionEffect=function(r,l){return h.H.useInsertionEffect(r,l)},T.useLayoutEffect=function(r,l){return h.H.useLayoutEffect(r,l)},T.useMemo=function(r,l){return h.H.useMemo(r,l)},T.useOptimistic=function(r,l){return h.H.useOptimistic(r,l)},T.useReducer=function(r,l,w){return h.H.useReducer(r,l,w)},T.useRef=function(r){return h.H.useRef(r)},T.useState=function(r){return h.H.useState(r)},T.useSyncExternalStore=function(r,l,w){return h.H.useSyncExternalStore(r,l,w)},T.useTransition=function(){return h.H.useTransition()},T.version="19.3.1",T}var bt;function ye(){return bt||(bt=1,it.exports=fe()),it.exports}var nt=ye();/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ge=o=>o.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),pe=o=>o.replace(/^([A-Z])|[\s-_]+(\w)/g,(i,a,e)=>e?e.toUpperCase():a.toLowerCase()),Pt=o=>{const i=pe(o);return i.charAt(0).toUpperCase()+i.slice(1)},se=(...o)=>o.filter((i,a,e)=>!!i&&i.trim()!==""&&e.indexOf(i)===a).join(" ").trim(),ke=o=>{for(const i in o)if(i.startsWith("aria-")||i==="role"||i==="title")return!0};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var me={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const we=nt.forwardRef(({color:o="currentColor",size:i=24,strokeWidth:a=2,absoluteStrokeWidth:e,className:t="",children:n,iconNode:s,...u},c)=>nt.createElement("svg",{ref:c,...me,width:i,height:i,stroke:o,strokeWidth:e?Number(a)*24/Number(i):a,className:se("lucide",t),...!n&&!ke(u)&&{"aria-hidden":"true"},...u},[...s.map(([f,g])=>nt.createElement(f,g)),...Array.isArray(n)?n:[n]]));/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=(o,i)=>{const a=nt.forwardRef(({className:e,...t},n)=>nt.createElement(we,{ref:n,iconNode:i,className:se(`lucide-${ge(Pt(o))}`,`lucide-${o}`,e),...t}));return a.displayName=Pt(o),a};/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],dr=d("activity",_e);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Me=[["path",{d:"M17 7 7 17",key:"15tmo1"}],["path",{d:"M17 17H7V7",key:"1org7z"}]],hr=d("arrow-down-left",Me);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ve=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],fr=d("arrow-left",ve);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ce=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],yr=d("arrow-right",Ce);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=[["path",{d:"m21 16-4 4-4-4",key:"f6ql7i"}],["path",{d:"M17 20V4",key:"1ejh1v"}],["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}]],gr=d("arrow-up-down",Ee);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]],pr=d("arrow-up-right",Ne);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M3 5v14",key:"1nt18q"}],["path",{d:"M8 5v14",key:"1ybrkv"}],["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"M17 5v14",key:"ycjyhj"}],["path",{d:"M21 5v14",key:"nzette"}]],kr=d("barcode",Ae);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Re=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],mr=d("building-2",Re);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],wr=d("calendar",Te);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=[["path",{d:"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z",key:"18u6gg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],_r=d("camera",Be);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Se=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],Mr=d("check",Se);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const be=[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]],vr=d("chevron-left",be);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],Cr=d("chevron-right",Pe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],Er=d("circle-alert",Ie);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],Nr=d("circle-check-big",qe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],Ar=d("circle-check",xe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=[["path",{d:"M11 14h10",key:"1w8e9d"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v1.344",key:"1e62lh"}],["path",{d:"m17 18 4-4-4-4",key:"z2g111"}],["path",{d:"M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113",key:"bjbb7m"}],["rect",{x:"8",y:"2",width:"8",height:"4",rx:"1",key:"ublpy"}]],Rr=d("clipboard-paste",Le);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=[["path",{d:"M12 13v8l-4-4",key:"1f5nwf"}],["path",{d:"m12 21 4-4",key:"1lfcce"}],["path",{d:"M4.393 15.269A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.436 8.284",key:"ui1hmy"}]],Tr=d("cloud-download",$e);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=[["path",{d:"M12 13v8",key:"1l5pq0"}],["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"m8 17 4-4 4 4",key:"1quai1"}]],Br=d("cloud-upload",He);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]],Sr=d("cloud",De);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ze=[["circle",{cx:"8",cy:"8",r:"6",key:"3yglwk"}],["path",{d:"M18.09 10.37A6 6 0 1 1 10.34 18",key:"t5s6rm"}],["path",{d:"M7 6h1v4",key:"1obek4"}],["path",{d:"m16.71 13.88.7.71-2.82 2.82",key:"1rbuyh"}]],br=d("coins",ze);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=[["path",{d:"M16 2v2",key:"scm5qe"}],["path",{d:"M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2",key:"1waht3"}],["path",{d:"M8 2v2",key:"pbkmx"}],["circle",{cx:"12",cy:"11",r:"3",key:"itu57m"}],["rect",{x:"3",y:"4",width:"18",height:"18",rx:"2",key:"12vinp"}]],Pr=d("contact",Ue);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],Ir=d("copy",je);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]],qr=d("database",Ve);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],xr=d("download",Fe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],Lr=d("external-link",Oe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],$r=d("eye-off",Ye);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Hr=d("eye",Ke);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]],Dr=d("file-check-2",Je);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]],zr=d("file-spreadsheet",Ge);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],Ur=d("file-text",Qe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=[["path",{d:"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4",key:"1slcih"}]],jr=d("flame",Ze);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],Vr=d("globe",We);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["line",{x1:"22",x2:"2",y1:"12",y2:"12",key:"1y58io"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}],["line",{x1:"6",x2:"6.01",y1:"16",y2:"16",key:"sgf278"}],["line",{x1:"10",x2:"10.01",y1:"16",y2:"16",key:"1l4acy"}]],Fr=d("hard-drive",Xe);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tn=[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]],Or=d("key-round",tn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const en=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Yr=d("layers",en);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nn=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],Kr=d("layout-dashboard",nn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rn=[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]],Jr=d("layout-grid",rn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const on=[["path",{d:"M3 5h.01",key:"18ugdj"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M3 19h.01",key:"noohij"}],["path",{d:"M8 5h13",key:"1pao27"}],["path",{d:"M8 12h13",key:"1za7za"}],["path",{d:"M8 19h13",key:"m83p4d"}]],Gr=d("list",on);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const an=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]],Qr=d("lock-open",an);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sn=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],Zr=d("lock",sn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cn=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],Wr=d("map-pin",cn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const un=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]],Xr=d("message-square",un);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ln=[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]],to=d("monitor",ln);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dn=[["path",{d:"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",key:"1a0edw"}],["path",{d:"M12 22V12",key:"d0xqtd"}],["polyline",{points:"3.29 7 12 12 20.71 7",key:"ousv84"}],["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}]],eo=d("package",dn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hn=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],no=d("pen",hn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fn=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],ro=d("phone",fn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yn=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],oo=d("plus",yn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gn=[["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["path",{d:"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6",key:"1itne7"}],["rect",{x:"6",y:"14",width:"12",height:"8",rx:"1",key:"1ue0tg"}]],io=d("printer",gn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pn=[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]],ao=d("qr-code",pn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kn=[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]],so=d("receipt",kn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mn=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],co=d("refresh-cw",mn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wn=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],uo=d("rotate-ccw",wn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _n=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],lo=d("save",_n);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],ho=d("search",Mn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vn=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],fo=d("settings",vn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cn=[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]],yo=d("share-2",Cn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const En=[["path",{d:"M12 2v13",key:"1km8f5"}],["path",{d:"m16 6-4-4-4 4",key:"13yo43"}],["path",{d:"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8",key:"1b2hhj"}]],go=d("share",En);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nn=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]],po=d("shield-alert",Nn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const An=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],ko=d("shield-check",An);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]],mo=d("shopping-bag",Rn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tn=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],wo=d("smartphone",Tn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bn=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],_o=d("sparkles",Bn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sn=[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]],Mo=d("square-plus",Sn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bn=[["path",{d:"M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5",key:"slp6dd"}],["path",{d:"M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",key:"o0xfot"}],["path",{d:"M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05",key:"wn3emo"}]],vo=d("store",bn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pn=[["path",{d:"M10 11v6",key:"nco0om"}],["path",{d:"M14 11v6",key:"outv1u"}],["path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",key:"miytrc"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",key:"e791ji"}]],Co=d("trash-2",Pn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const In=[["path",{d:"M16 17h6v-6",key:"t6n2it"}],["path",{d:"m22 17-8.5-8.5-5 5L2 7",key:"x473p"}]],Eo=d("trending-down",In);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qn=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],No=d("trending-up",qn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xn=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Ao=d("triangle-alert",xn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ln=[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]],Ro=d("truck",Ln);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],To=d("upload",$n);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hn=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]],Bo=d("user-plus",Hn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dn=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],So=d("user",Dn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zn=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],bo=d("users",zn);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Un=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Po=d("x",Un);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jn=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],Io=d("zap",jn);var W={},at,It;function Vn(){return It||(It=1,at=function(){return typeof Promise=="function"&&Promise.prototype&&Promise.prototype.then}),at}var st={},O={},qt;function G(){if(qt)return O;qt=1;let o;const i=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];return O.getSymbolSize=function(e){if(!e)throw new Error('"version" cannot be null or undefined');if(e<1||e>40)throw new Error('"version" should be in range from 1 to 40');return e*4+17},O.getSymbolTotalCodewords=function(e){return i[e]},O.getBCHDigit=function(a){let e=0;for(;a!==0;)e++,a>>>=1;return e},O.setToSJISFunction=function(e){if(typeof e!="function")throw new Error('"toSJISFunc" is not a valid function.');o=e},O.isKanjiModeEnabled=function(){return typeof o<"u"},O.toSJIS=function(e){return o(e)},O}var ct={},xt;function Bt(){return xt||(xt=1,(function(o){o.L={bit:1},o.M={bit:0},o.Q={bit:3},o.H={bit:2};function i(a){if(typeof a!="string")throw new Error("Param is not a string");switch(a.toLowerCase()){case"l":case"low":return o.L;case"m":case"medium":return o.M;case"q":case"quartile":return o.Q;case"h":case"high":return o.H;default:throw new Error("Unknown EC Level: "+a)}}o.isValid=function(e){return e&&typeof e.bit<"u"&&e.bit>=0&&e.bit<4},o.from=function(e,t){if(o.isValid(e))return e;try{return i(e)}catch{return t}}})(ct)),ct}var ut,Lt;function Fn(){if(Lt)return ut;Lt=1;function o(){this.buffer=[],this.length=0}return o.prototype={get:function(i){const a=Math.floor(i/8);return(this.buffer[a]>>>7-i%8&1)===1},put:function(i,a){for(let e=0;e<a;e++)this.putBit((i>>>a-e-1&1)===1)},getLengthInBits:function(){return this.length},putBit:function(i){const a=Math.floor(this.length/8);this.buffer.length<=a&&this.buffer.push(0),i&&(this.buffer[a]|=128>>>this.length%8),this.length++}},ut=o,ut}var lt,$t;function On(){if($t)return lt;$t=1;function o(i){if(!i||i<1)throw new Error("BitMatrix size must be defined and greater than 0");this.size=i,this.data=new Uint8Array(i*i),this.reservedBit=new Uint8Array(i*i)}return o.prototype.set=function(i,a,e,t){const n=i*this.size+a;this.data[n]=e,t&&(this.reservedBit[n]=!0)},o.prototype.get=function(i,a){return this.data[i*this.size+a]},o.prototype.xor=function(i,a,e){this.data[i*this.size+a]^=e},o.prototype.isReserved=function(i,a){return this.reservedBit[i*this.size+a]},lt=o,lt}var dt={},Ht;function Yn(){return Ht||(Ht=1,(function(o){const i=G().getSymbolSize;o.getRowColCoords=function(e){if(e===1)return[];const t=Math.floor(e/7)+2,n=i(e),s=n===145?26:Math.ceil((n-13)/(2*t-2))*2,u=[n-7];for(let c=1;c<t-1;c++)u[c]=u[c-1]-s;return u.push(6),u.reverse()},o.getPositions=function(e){const t=[],n=o.getRowColCoords(e),s=n.length;for(let u=0;u<s;u++)for(let c=0;c<s;c++)u===0&&c===0||u===0&&c===s-1||u===s-1&&c===0||t.push([n[u],n[c]]);return t}})(dt)),dt}var ht={},Dt;function Kn(){if(Dt)return ht;Dt=1;const o=G().getSymbolSize,i=7;return ht.getPositions=function(e){const t=o(e);return[[0,0],[t-i,0],[0,t-i]]},ht}var ft={},zt;function Jn(){return zt||(zt=1,(function(o){o.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};const i={N1:3,N2:3,N3:40,N4:10};o.isValid=function(t){return t!=null&&t!==""&&!isNaN(t)&&t>=0&&t<=7},o.from=function(t){return o.isValid(t)?parseInt(t,10):void 0},o.getPenaltyN1=function(t){const n=t.size;let s=0,u=0,c=0,f=null,g=null;for(let R=0;R<n;R++){u=c=0,f=g=null;for(let _=0;_<n;_++){let y=t.get(R,_);y===f?u++:(u>=5&&(s+=i.N1+(u-5)),f=y,u=1),y=t.get(_,R),y===g?c++:(c>=5&&(s+=i.N1+(c-5)),g=y,c=1)}u>=5&&(s+=i.N1+(u-5)),c>=5&&(s+=i.N1+(c-5))}return s},o.getPenaltyN2=function(t){const n=t.size;let s=0;for(let u=0;u<n-1;u++)for(let c=0;c<n-1;c++){const f=t.get(u,c)+t.get(u,c+1)+t.get(u+1,c)+t.get(u+1,c+1);(f===4||f===0)&&s++}return s*i.N2},o.getPenaltyN3=function(t){const n=t.size;let s=0,u=0,c=0;for(let f=0;f<n;f++){u=c=0;for(let g=0;g<n;g++)u=u<<1&2047|t.get(f,g),g>=10&&(u===1488||u===93)&&s++,c=c<<1&2047|t.get(g,f),g>=10&&(c===1488||c===93)&&s++}return s*i.N3},o.getPenaltyN4=function(t){let n=0;const s=t.data.length;for(let c=0;c<s;c++)n+=t.data[c];return Math.abs(Math.ceil(n*100/s/5)-10)*i.N4};function a(e,t,n){switch(e){case o.Patterns.PATTERN000:return(t+n)%2===0;case o.Patterns.PATTERN001:return t%2===0;case o.Patterns.PATTERN010:return n%3===0;case o.Patterns.PATTERN011:return(t+n)%3===0;case o.Patterns.PATTERN100:return(Math.floor(t/2)+Math.floor(n/3))%2===0;case o.Patterns.PATTERN101:return t*n%2+t*n%3===0;case o.Patterns.PATTERN110:return(t*n%2+t*n%3)%2===0;case o.Patterns.PATTERN111:return(t*n%3+(t+n)%2)%2===0;default:throw new Error("bad maskPattern:"+e)}}o.applyMask=function(t,n){const s=n.size;for(let u=0;u<s;u++)for(let c=0;c<s;c++)n.isReserved(c,u)||n.xor(c,u,a(t,c,u))},o.getBestMask=function(t,n){const s=Object.keys(o.Patterns).length;let u=0,c=1/0;for(let f=0;f<s;f++){n(f),o.applyMask(f,t);const g=o.getPenaltyN1(t)+o.getPenaltyN2(t)+o.getPenaltyN3(t)+o.getPenaltyN4(t);o.applyMask(f,t),g<c&&(c=g,u=f)}return u}})(ft)),ft}var rt={},Ut;function ce(){if(Ut)return rt;Ut=1;const o=Bt(),i=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],a=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];return rt.getBlocksCount=function(t,n){switch(n){case o.L:return i[(t-1)*4+0];case o.M:return i[(t-1)*4+1];case o.Q:return i[(t-1)*4+2];case o.H:return i[(t-1)*4+3];default:return}},rt.getTotalCodewordsCount=function(t,n){switch(n){case o.L:return a[(t-1)*4+0];case o.M:return a[(t-1)*4+1];case o.Q:return a[(t-1)*4+2];case o.H:return a[(t-1)*4+3];default:return}},rt}var yt={},et={},jt;function Gn(){if(jt)return et;jt=1;const o=new Uint8Array(512),i=new Uint8Array(256);return(function(){let e=1;for(let t=0;t<255;t++)o[t]=e,i[e]=t,e<<=1,e&256&&(e^=285);for(let t=255;t<512;t++)o[t]=o[t-255]})(),et.log=function(e){if(e<1)throw new Error("log("+e+")");return i[e]},et.exp=function(e){return o[e]},et.mul=function(e,t){return e===0||t===0?0:o[i[e]+i[t]]},et}var Vt;function Qn(){return Vt||(Vt=1,(function(o){const i=Gn();o.mul=function(e,t){const n=new Uint8Array(e.length+t.length-1);for(let s=0;s<e.length;s++)for(let u=0;u<t.length;u++)n[s+u]^=i.mul(e[s],t[u]);return n},o.mod=function(e,t){let n=new Uint8Array(e);for(;n.length-t.length>=0;){const s=n[0];for(let c=0;c<t.length;c++)n[c]^=i.mul(t[c],s);let u=0;for(;u<n.length&&n[u]===0;)u++;n=n.slice(u)}return n},o.generateECPolynomial=function(e){let t=new Uint8Array([1]);for(let n=0;n<e;n++)t=o.mul(t,new Uint8Array([1,i.exp(n)]));return t}})(yt)),yt}var gt,Ft;function Zn(){if(Ft)return gt;Ft=1;const o=Qn();function i(a){this.genPoly=void 0,this.degree=a,this.degree&&this.initialize(this.degree)}return i.prototype.initialize=function(e){this.degree=e,this.genPoly=o.generateECPolynomial(this.degree)},i.prototype.encode=function(e){if(!this.genPoly)throw new Error("Encoder not initialized");const t=new Uint8Array(e.length+this.degree);t.set(e);const n=o.mod(t,this.genPoly),s=this.degree-n.length;if(s>0){const u=new Uint8Array(this.degree);return u.set(n,s),u}return n},gt=i,gt}var pt={},kt={},mt={},Ot;function ue(){return Ot||(Ot=1,mt.isValid=function(i){return!isNaN(i)&&i>=1&&i<=40}),mt}var V={},Yt;function le(){if(Yt)return V;Yt=1;const o="[0-9]+",i="[A-Z $%*+\\-./:]+";let a="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";a=a.replace(/u/g,"\\u");const e="(?:(?![A-Z0-9 $%*+\\-./:]|"+a+`)(?:.|[\r
]))+`;V.KANJI=new RegExp(a,"g"),V.BYTE_KANJI=new RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),V.BYTE=new RegExp(e,"g"),V.NUMERIC=new RegExp(o,"g"),V.ALPHANUMERIC=new RegExp(i,"g");const t=new RegExp("^"+a+"$"),n=new RegExp("^"+o+"$"),s=new RegExp("^[A-Z0-9 $%*+\\-./:]+$");return V.testKanji=function(c){return t.test(c)},V.testNumeric=function(c){return n.test(c)},V.testAlphanumeric=function(c){return s.test(c)},V}var Kt;function Q(){return Kt||(Kt=1,(function(o){const i=ue(),a=le();o.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},o.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},o.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},o.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},o.MIXED={bit:-1},o.getCharCountIndicator=function(n,s){if(!n.ccBits)throw new Error("Invalid mode: "+n);if(!i.isValid(s))throw new Error("Invalid version: "+s);return s>=1&&s<10?n.ccBits[0]:s<27?n.ccBits[1]:n.ccBits[2]},o.getBestModeForData=function(n){return a.testNumeric(n)?o.NUMERIC:a.testAlphanumeric(n)?o.ALPHANUMERIC:a.testKanji(n)?o.KANJI:o.BYTE},o.toString=function(n){if(n&&n.id)return n.id;throw new Error("Invalid mode")},o.isValid=function(n){return n&&n.bit&&n.ccBits};function e(t){if(typeof t!="string")throw new Error("Param is not a string");switch(t.toLowerCase()){case"numeric":return o.NUMERIC;case"alphanumeric":return o.ALPHANUMERIC;case"kanji":return o.KANJI;case"byte":return o.BYTE;default:throw new Error("Unknown mode: "+t)}}o.from=function(n,s){if(o.isValid(n))return n;try{return e(n)}catch{return s}}})(kt)),kt}var Jt;function Wn(){return Jt||(Jt=1,(function(o){const i=G(),a=ce(),e=Bt(),t=Q(),n=ue(),s=7973,u=i.getBCHDigit(s);function c(_,y,I){for(let x=1;x<=40;x++)if(y<=o.getCapacity(x,I,_))return x}function f(_,y){return t.getCharCountIndicator(_,y)+4}function g(_,y){let I=0;return _.forEach(function(x){const H=f(x.mode,y);I+=H+x.getBitsLength()}),I}function R(_,y){for(let I=1;I<=40;I++)if(g(_,I)<=o.getCapacity(I,y,t.MIXED))return I}o.from=function(y,I){return n.isValid(y)?parseInt(y,10):I},o.getCapacity=function(y,I,x){if(!n.isValid(y))throw new Error("Invalid QR Code version");typeof x>"u"&&(x=t.BYTE);const H=i.getSymbolTotalCodewords(y),B=a.getTotalCodewordsCount(y,I),P=(H-B)*8;if(x===t.MIXED)return P;const S=P-f(x,y);switch(x){case t.NUMERIC:return Math.floor(S/10*3);case t.ALPHANUMERIC:return Math.floor(S/11*2);case t.KANJI:return Math.floor(S/13);case t.BYTE:default:return Math.floor(S/8)}},o.getBestVersionForData=function(y,I){let x;const H=e.from(I,e.M);if(Array.isArray(y)){if(y.length>1)return R(y,H);if(y.length===0)return 1;x=y[0]}else x=y;return c(x.mode,x.getLength(),H)},o.getEncodedBits=function(y){if(!n.isValid(y)||y<7)throw new Error("Invalid QR Code version");let I=y<<12;for(;i.getBCHDigit(I)-u>=0;)I^=s<<i.getBCHDigit(I)-u;return y<<12|I}})(pt)),pt}var wt={},Gt;function Xn(){if(Gt)return wt;Gt=1;const o=G(),i=1335,a=21522,e=o.getBCHDigit(i);return wt.getEncodedBits=function(n,s){const u=n.bit<<3|s;let c=u<<10;for(;o.getBCHDigit(c)-e>=0;)c^=i<<o.getBCHDigit(c)-e;return(u<<10|c)^a},wt}var _t={},Mt,Qt;function tr(){if(Qt)return Mt;Qt=1;const o=Q();function i(a){this.mode=o.NUMERIC,this.data=a.toString()}return i.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(e){let t,n,s;for(t=0;t+3<=this.data.length;t+=3)n=this.data.substr(t,3),s=parseInt(n,10),e.put(s,10);const u=this.data.length-t;u>0&&(n=this.data.substr(t),s=parseInt(n,10),e.put(s,u*3+1))},Mt=i,Mt}var vt,Zt;function er(){if(Zt)return vt;Zt=1;const o=Q(),i=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function a(e){this.mode=o.ALPHANUMERIC,this.data=e}return a.getBitsLength=function(t){return 11*Math.floor(t/2)+6*(t%2)},a.prototype.getLength=function(){return this.data.length},a.prototype.getBitsLength=function(){return a.getBitsLength(this.data.length)},a.prototype.write=function(t){let n;for(n=0;n+2<=this.data.length;n+=2){let s=i.indexOf(this.data[n])*45;s+=i.indexOf(this.data[n+1]),t.put(s,11)}this.data.length%2&&t.put(i.indexOf(this.data[n]),6)},vt=a,vt}var Ct,Wt;function nr(){if(Wt)return Ct;Wt=1;const o=Q();function i(a){this.mode=o.BYTE,typeof a=="string"?this.data=new TextEncoder().encode(a):this.data=new Uint8Array(a)}return i.getBitsLength=function(e){return e*8},i.prototype.getLength=function(){return this.data.length},i.prototype.getBitsLength=function(){return i.getBitsLength(this.data.length)},i.prototype.write=function(a){for(let e=0,t=this.data.length;e<t;e++)a.put(this.data[e],8)},Ct=i,Ct}var Et,Xt;function rr(){if(Xt)return Et;Xt=1;const o=Q(),i=G();function a(e){this.mode=o.KANJI,this.data=e}return a.getBitsLength=function(t){return t*13},a.prototype.getLength=function(){return this.data.length},a.prototype.getBitsLength=function(){return a.getBitsLength(this.data.length)},a.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let n=i.toSJIS(this.data[t]);if(n>=33088&&n<=40956)n-=33088;else if(n>=57408&&n<=60351)n-=49472;else throw new Error("Invalid SJIS character: "+this.data[t]+`
Make sure your charset is UTF-8`);n=(n>>>8&255)*192+(n&255),e.put(n,13)}},Et=a,Et}var Nt={exports:{}},te;function or(){return te||(te=1,(function(o){var i={single_source_shortest_paths:function(a,e,t){var n={},s={};s[e]=0;var u=i.PriorityQueue.make();u.push(e,0);for(var c,f,g,R,_,y,I,x,H;!u.empty();){c=u.pop(),f=c.value,R=c.cost,_=a[f]||{};for(g in _)_.hasOwnProperty(g)&&(y=_[g],I=R+y,x=s[g],H=typeof s[g]>"u",(H||x>I)&&(s[g]=I,u.push(g,I),n[g]=f))}if(typeof t<"u"&&typeof s[t]>"u"){var B=["Could not find a path from ",e," to ",t,"."].join("");throw new Error(B)}return n},extract_shortest_path_from_predecessor_list:function(a,e){for(var t=[],n=e;n;)t.push(n),a[n],n=a[n];return t.reverse(),t},find_path:function(a,e,t){var n=i.single_source_shortest_paths(a,e,t);return i.extract_shortest_path_from_predecessor_list(n,t)},PriorityQueue:{make:function(a){var e=i.PriorityQueue,t={},n;a=a||{};for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t.queue=[],t.sorter=a.sorter||e.default_sorter,t},default_sorter:function(a,e){return a.cost-e.cost},push:function(a,e){var t={value:a,cost:e};this.queue.push(t),this.queue.sort(this.sorter)},pop:function(){return this.queue.shift()},empty:function(){return this.queue.length===0}}};o.exports=i})(Nt)),Nt.exports}var ee;function ir(){return ee||(ee=1,(function(o){const i=Q(),a=tr(),e=er(),t=nr(),n=rr(),s=le(),u=G(),c=or();function f(B){return unescape(encodeURIComponent(B)).length}function g(B,P,S){const N=[];let D;for(;(D=B.exec(S))!==null;)N.push({data:D[0],index:D.index,mode:P,length:D[0].length});return N}function R(B){const P=g(s.NUMERIC,i.NUMERIC,B),S=g(s.ALPHANUMERIC,i.ALPHANUMERIC,B);let N,D;return u.isKanjiModeEnabled()?(N=g(s.BYTE,i.BYTE,B),D=g(s.KANJI,i.KANJI,B)):(N=g(s.BYTE_KANJI,i.BYTE,B),D=[]),P.concat(S,N,D).sort(function(M,h){return M.index-h.index}).map(function(M){return{data:M.data,mode:M.mode,length:M.length}})}function _(B,P){switch(P){case i.NUMERIC:return a.getBitsLength(B);case i.ALPHANUMERIC:return e.getBitsLength(B);case i.KANJI:return n.getBitsLength(B);case i.BYTE:return t.getBitsLength(B)}}function y(B){return B.reduce(function(P,S){const N=P.length-1>=0?P[P.length-1]:null;return N&&N.mode===S.mode?(P[P.length-1].data+=S.data,P):(P.push(S),P)},[])}function I(B){const P=[];for(let S=0;S<B.length;S++){const N=B[S];switch(N.mode){case i.NUMERIC:P.push([N,{data:N.data,mode:i.ALPHANUMERIC,length:N.length},{data:N.data,mode:i.BYTE,length:N.length}]);break;case i.ALPHANUMERIC:P.push([N,{data:N.data,mode:i.BYTE,length:N.length}]);break;case i.KANJI:P.push([N,{data:N.data,mode:i.BYTE,length:f(N.data)}]);break;case i.BYTE:P.push([{data:N.data,mode:i.BYTE,length:f(N.data)}])}}return P}function x(B,P){const S={},N={start:{}};let D=["start"];for(let m=0;m<B.length;m++){const M=B[m],h=[];for(let p=0;p<M.length;p++){const A=M[p],v=""+m+p;h.push(v),S[v]={node:A,lastCount:0},N[v]={};for(let C=0;C<D.length;C++){const E=D[C];S[E]&&S[E].node.mode===A.mode?(N[E][v]=_(S[E].lastCount+A.length,A.mode)-_(S[E].lastCount,A.mode),S[E].lastCount+=A.length):(S[E]&&(S[E].lastCount=A.length),N[E][v]=_(A.length,A.mode)+4+i.getCharCountIndicator(A.mode,P))}}D=h}for(let m=0;m<D.length;m++)N[D[m]].end=0;return{map:N,table:S}}function H(B,P){let S;const N=i.getBestModeForData(B);if(S=i.from(P,N),S!==i.BYTE&&S.bit<N.bit)throw new Error('"'+B+'" cannot be encoded with mode '+i.toString(S)+`.
 Suggested mode is: `+i.toString(N));switch(S===i.KANJI&&!u.isKanjiModeEnabled()&&(S=i.BYTE),S){case i.NUMERIC:return new a(B);case i.ALPHANUMERIC:return new e(B);case i.KANJI:return new n(B);case i.BYTE:return new t(B)}}o.fromArray=function(P){return P.reduce(function(S,N){return typeof N=="string"?S.push(H(N,null)):N.data&&S.push(H(N.data,N.mode)),S},[])},o.fromString=function(P,S){const N=R(P,u.isKanjiModeEnabled()),D=I(N),m=x(D,S),M=c.find_path(m.map,"start","end"),h=[];for(let p=1;p<M.length-1;p++)h.push(m.table[M[p]].node);return o.fromArray(y(h))},o.rawSplit=function(P){return o.fromArray(R(P,u.isKanjiModeEnabled()))}})(_t)),_t}var ne;function ar(){if(ne)return st;ne=1;const o=G(),i=Bt(),a=Fn(),e=On(),t=Yn(),n=Kn(),s=Jn(),u=ce(),c=Zn(),f=Wn(),g=Xn(),R=Q(),_=ir();function y(m,M){const h=m.size,p=n.getPositions(M);for(let A=0;A<p.length;A++){const v=p[A][0],C=p[A][1];for(let E=-1;E<=7;E++)if(!(v+E<=-1||h<=v+E))for(let b=-1;b<=7;b++)C+b<=-1||h<=C+b||(E>=0&&E<=6&&(b===0||b===6)||b>=0&&b<=6&&(E===0||E===6)||E>=2&&E<=4&&b>=2&&b<=4?m.set(v+E,C+b,!0,!0):m.set(v+E,C+b,!1,!0))}}function I(m){const M=m.size;for(let h=8;h<M-8;h++){const p=h%2===0;m.set(h,6,p,!0),m.set(6,h,p,!0)}}function x(m,M){const h=t.getPositions(M);for(let p=0;p<h.length;p++){const A=h[p][0],v=h[p][1];for(let C=-2;C<=2;C++)for(let E=-2;E<=2;E++)C===-2||C===2||E===-2||E===2||C===0&&E===0?m.set(A+C,v+E,!0,!0):m.set(A+C,v+E,!1,!0)}}function H(m,M){const h=m.size,p=f.getEncodedBits(M);let A,v,C;for(let E=0;E<18;E++)A=Math.floor(E/3),v=E%3+h-8-3,C=(p>>E&1)===1,m.set(A,v,C,!0),m.set(v,A,C,!0)}function B(m,M,h){const p=m.size,A=g.getEncodedBits(M,h);let v,C;for(v=0;v<15;v++)C=(A>>v&1)===1,v<6?m.set(v,8,C,!0):v<8?m.set(v+1,8,C,!0):m.set(p-15+v,8,C,!0),v<8?m.set(8,p-v-1,C,!0):v<9?m.set(8,15-v-1+1,C,!0):m.set(8,15-v-1,C,!0);m.set(p-8,8,1,!0)}function P(m,M){const h=m.size;let p=-1,A=h-1,v=7,C=0;for(let E=h-1;E>0;E-=2)for(E===6&&E--;;){for(let b=0;b<2;b++)if(!m.isReserved(A,E-b)){let U=!1;C<M.length&&(U=(M[C]>>>v&1)===1),m.set(A,E-b,U),v--,v===-1&&(C++,v=7)}if(A+=p,A<0||h<=A){A-=p,p=-p;break}}}function S(m,M,h){const p=new a;h.forEach(function(b){p.put(b.mode.bit,4),p.put(b.getLength(),R.getCharCountIndicator(b.mode,m)),b.write(p)});const A=o.getSymbolTotalCodewords(m),v=u.getTotalCodewordsCount(m,M),C=(A-v)*8;for(p.getLengthInBits()+4<=C&&p.put(0,4);p.getLengthInBits()%8!==0;)p.putBit(0);const E=(C-p.getLengthInBits())/8;for(let b=0;b<E;b++)p.put(b%2?17:236,8);return N(p,m,M)}function N(m,M,h){const p=o.getSymbolTotalCodewords(M),A=u.getTotalCodewordsCount(M,h),v=p-A,C=u.getBlocksCount(M,h),E=p%C,b=C-E,U=Math.floor(p/C),Y=Math.floor(v/C),F=Y+1,K=U-Y,ot=new c(K);let Z=0;const J=new Array(C),X=new Array(C);let tt=0;const r=new Uint8Array(m.buffer);for(let L=0;L<C;L++){const $=L<b?Y:F;J[L]=r.slice(Z,Z+$),X[L]=ot.encode(J[L]),Z+=$,tt=Math.max(tt,$)}const l=new Uint8Array(p);let w=0,k,q;for(k=0;k<tt;k++)for(q=0;q<C;q++)k<J[q].length&&(l[w++]=J[q][k]);for(k=0;k<K;k++)for(q=0;q<C;q++)l[w++]=X[q][k];return l}function D(m,M,h,p){let A;if(Array.isArray(m))A=_.fromArray(m);else if(typeof m=="string"){let U=M;if(!U){const Y=_.rawSplit(m);U=f.getBestVersionForData(Y,h)}A=_.fromString(m,U||40)}else throw new Error("Invalid data");const v=f.getBestVersionForData(A,h);if(!v)throw new Error("The amount of data is too big to be stored in a QR Code");if(!M)M=v;else if(M<v)throw new Error(`
The chosen QR Code version cannot contain this amount of data.
Minimum version required to store current data is: `+v+`.
`);const C=S(M,h,A),E=o.getSymbolSize(M),b=new e(E);return y(b,M),I(b),x(b,M),B(b,h,0),M>=7&&H(b,M),P(b,C),isNaN(p)&&(p=s.getBestMask(b,B.bind(null,b,h))),s.applyMask(p,b),B(b,h,p),{modules:b,version:M,errorCorrectionLevel:h,maskPattern:p,segments:A}}return st.create=function(M,h){if(typeof M>"u"||M==="")throw new Error("No input text");let p=i.M,A,v;return typeof h<"u"&&(p=i.from(h.errorCorrectionLevel,i.M),A=f.from(h.version),v=s.from(h.maskPattern),h.toSJISFunc&&o.setToSJISFunction(h.toSJISFunc)),D(M,A,p,v)},st}var At={},Rt={},re;function de(){return re||(re=1,(function(o){function i(a){if(typeof a=="number"&&(a=a.toString()),typeof a!="string")throw new Error("Color should be defined as hex string");let e=a.slice().replace("#","").split("");if(e.length<3||e.length===5||e.length>8)throw new Error("Invalid hex color: "+a);(e.length===3||e.length===4)&&(e=Array.prototype.concat.apply([],e.map(function(n){return[n,n]}))),e.length===6&&e.push("F","F");const t=parseInt(e.join(""),16);return{r:t>>24&255,g:t>>16&255,b:t>>8&255,a:t&255,hex:"#"+e.slice(0,6).join("")}}o.getOptions=function(e){e||(e={}),e.color||(e.color={});const t=typeof e.margin>"u"||e.margin===null||e.margin<0?4:e.margin,n=e.width&&e.width>=21?e.width:void 0,s=e.scale||4;return{width:n,scale:n?4:s,margin:t,color:{dark:i(e.color.dark||"#000000ff"),light:i(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},o.getScale=function(e,t){return t.width&&t.width>=e+t.margin*2?t.width/(e+t.margin*2):t.scale},o.getImageWidth=function(e,t){const n=o.getScale(e,t);return Math.floor((e+t.margin*2)*n)},o.qrToImageData=function(e,t,n){const s=t.modules.size,u=t.modules.data,c=o.getScale(s,n),f=Math.floor((s+n.margin*2)*c),g=n.margin*c,R=[n.color.light,n.color.dark];for(let _=0;_<f;_++)for(let y=0;y<f;y++){let I=(_*f+y)*4,x=n.color.light;if(_>=g&&y>=g&&_<f-g&&y<f-g){const H=Math.floor((_-g)/c),B=Math.floor((y-g)/c);x=R[u[H*s+B]?1:0]}e[I++]=x.r,e[I++]=x.g,e[I++]=x.b,e[I]=x.a}}})(Rt)),Rt}var oe;function sr(){return oe||(oe=1,(function(o){const i=de();function a(t,n,s){t.clearRect(0,0,n.width,n.height),n.style||(n.style={}),n.height=s,n.width=s,n.style.height=s+"px",n.style.width=s+"px"}function e(){try{return document.createElement("canvas")}catch{throw new Error("You need to specify a canvas element")}}o.render=function(n,s,u){let c=u,f=s;typeof c>"u"&&(!s||!s.getContext)&&(c=s,s=void 0),s||(f=e()),c=i.getOptions(c);const g=i.getImageWidth(n.modules.size,c),R=f.getContext("2d"),_=R.createImageData(g,g);return i.qrToImageData(_.data,n,c),a(R,f,g),R.putImageData(_,0,0),f},o.renderToDataURL=function(n,s,u){let c=u;typeof c>"u"&&(!s||!s.getContext)&&(c=s,s=void 0),c||(c={});const f=o.render(n,s,c),g=c.type||"image/png",R=c.rendererOpts||{};return f.toDataURL(g,R.quality)}})(At)),At}var Tt={},ie;function cr(){if(ie)return Tt;ie=1;const o=de();function i(t,n){const s=t.a/255,u=n+'="'+t.hex+'"';return s<1?u+" "+n+'-opacity="'+s.toFixed(2).slice(1)+'"':u}function a(t,n,s){let u=t+n;return typeof s<"u"&&(u+=" "+s),u}function e(t,n,s){let u="",c=0,f=!1,g=0;for(let R=0;R<t.length;R++){const _=Math.floor(R%n),y=Math.floor(R/n);!_&&!f&&(f=!0),t[R]?(g++,R>0&&_>0&&t[R-1]||(u+=f?a("M",_+s,.5+y+s):a("m",c,0),c=0,f=!1),_+1<n&&t[R+1]||(u+=a("h",g),g=0)):c++}return u}return Tt.render=function(n,s,u){const c=o.getOptions(s),f=n.modules.size,g=n.modules.data,R=f+c.margin*2,_=c.color.light.a?"<path "+i(c.color.light,"fill")+' d="M0 0h'+R+"v"+R+'H0z"/>':"",y="<path "+i(c.color.dark,"stroke")+' d="'+e(g,f,c.margin)+'"/>',I='viewBox="0 0 '+R+" "+R+'"',H='<svg xmlns="http://www.w3.org/2000/svg" '+(c.width?'width="'+c.width+'" height="'+c.width+'" ':"")+I+' shape-rendering="crispEdges">'+_+y+`</svg>
`;return typeof u=="function"&&u(null,H),H},Tt}var ae;function qo(){if(ae)return W;ae=1;const o=Vn(),i=ar(),a=sr(),e=cr();function t(n,s,u,c,f){const g=[].slice.call(arguments,1),R=g.length,_=typeof g[R-1]=="function";if(!_&&!o())throw new Error("Callback required as last argument");if(_){if(R<2)throw new Error("Too few arguments provided");R===2?(f=u,u=s,s=c=void 0):R===3&&(s.getContext&&typeof f>"u"?(f=c,c=void 0):(f=c,c=u,u=s,s=void 0))}else{if(R<1)throw new Error("Too few arguments provided");return R===1?(u=s,s=c=void 0):R===2&&!s.getContext&&(c=u,u=s,s=void 0),new Promise(function(y,I){try{const x=i.create(u,c);y(n(x,s,c))}catch(x){I(x)}})}try{const y=i.create(u,c);f(null,n(y,s,c))}catch(y){f(y)}}return W.create=i.create,W.toCanvas=t.bind(null,a.render),W.toDataURL=t.bind(null,a.renderToDataURL),W.toString=t.bind(null,function(n,s,u){return e.render(n,u)}),W}export{Or as $,hr as A,oo as B,wr as C,_r as D,kr as E,Ur as F,Vr as G,Mr as H,mr as I,lo as J,dr as K,Kr as L,to as M,xr as N,co as O,eo as P,ao as Q,so as R,wo as S,No as T,bo as U,Ao as V,qr as W,Po as X,Fr as Y,Io as Z,Sr as _,nt as a,Ir as a0,Br as a1,Tr as a2,To as a3,vo as a4,ko as a5,po as a6,yo as a7,Jr as a8,Gr as a9,Yr as aa,jr as ab,go as ac,Mo as ad,Zr as ae,Rr as af,io as ag,Nr as ah,Lr as ai,lr as aj,qo as ak,So as al,Dr as am,Qr as an,$r as ao,Hr as ap,ur as aq,fo as b,Eo as c,br as d,_o as e,mo as f,Ro as g,pr as h,vr as i,Cr as j,ho as k,no as l,Wr as m,Pr as n,Bo as o,Er as p,gr as q,ye as r,uo as s,Ar as t,ro as u,zr as v,Xr as w,Co as x,yr as y,fr as z};
