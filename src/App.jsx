import { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// 🎨 カスタマイズはここだけ変更すればOK
// ============================================================
const SALON_CONFIG = {
  name: "サロン名", tagline: "Hair & Beauty", initial: "S",
  accent: "#7B9E87", accentLight: "#EEF4F1", accentDark: "#5A7A65",
  password: "1234",
  // 施術タグ：自由に追加・変更できます
  visitTags: [
    "カット", "カラー（基本）", "デザインカラー", "ブリーチ", "ハイライト",
    "パーマ", "ストレート・縮毛矯正", "トリートメント", "ヘッドスパ",
    "メンズカット", "カウンセリングのみ", "その他"
  ],
};
// ============================================================

const INITIAL_CUSTOMERS = [
  { id:1, name:"田中 美咲", kana:"たなか みさき", phone:"09012345678", email:"tanaka@email.com", birthday:"1990-05-15", address:"群馬県前橋市○○1-2-3", memo:"",
    visits:[
      { id:1, date:"2026-04-04 18:07", tags:["カット","トリートメント"], staff:"七海", memo:"根本200 毛先130 3:1 重めカット", drawing:null, purchases:[{ id:1, name:"アルガンオイルトリートメント", price:3800, memo:"" }] },
      { id:2, date:"2025-10-11 14:00", tags:["カラー（基本）"], staff:"七海", memo:"8トーン アッシュブラウン", drawing:null, purchases:[] },
    ]
  },
  { id:2, name:"佐藤 由香", kana:"さとう ゆか", phone:"08087654321", email:"", birthday:"", address:"", memo:"", visits:[{ id:1, date:"2026-03-15 13:00", tags:["カット"], staff:"", memo:"ショートボブに変更", drawing:null, purchases:[] }] },
  { id:3, name:"鈴木 花音", kana:"すずき かのん", phone:"07011112222", email:"", birthday:"1995-08-22", address:"", memo:"", visits:[] },
  { id:4, name:"山本 愛子", kana:"やまもと あいこ", phone:"09033334444", email:"", birthday:"", address:"", memo:"", visits:[{ id:1, date:"2026-04-06 15:30", tags:["ヘッドスパ"], staff:"", memo:"", drawing:null, purchases:[] }] },
  { id:5, name:"伊藤 恵", kana:"いとう めぐみ", phone:"08055556666", email:"", birthday:"", address:"", memo:"", visits:[{ id:1, date:"2026-04-10 10:00", tags:["カット","カラー（基本）"], staff:"七海", memo:"イルミナカラー 9トーン", drawing:null, purchases:[] }] },
];

const PENDING_INIT = [
  { id:1, name:"木村 さくら", kana:"きむら さくら", phone:"09011112222", email:"kimura@email.com", birthday:"1998-03-10", address:"群馬県高崎市○○2-3-4", memo:"", referral:"SNS（Instagram等）", submittedAt:"2026-04-11 10:23" },
  { id:2, name:"中村 由美", kana:"なかむら ゆみ", phone:"08022223333", email:"", birthday:"", address:"", memo:"パーマアレルギーあり", referral:"ご紹介", submittedAt:"2026-04-11 09:45" },
  { id:3, name:"小林 美穂", kana:"こばやし みほ", phone:"07033334444", email:"kobayashi@email.com", birthday:"2000-07-22", address:"", memo:"", referral:"ネット検索（Google等）", submittedAt:"2026-04-10 17:30" },
];

// 来店のきっかけ選択肢
const REFERRAL_OPTIONS = [
  { value:"紹介", icon:"👥", label:"ご紹介", sub:"知人・ご家族から" },
  { value:"sns", icon:"📱", label:"SNS（Instagram等）", sub:"インスタ・TikTok等を見て" },
  { value:"hotpepper", icon:"💻", label:"ホットペッパービューティー", sub:"ホットペッパーを見て" },
  { value:"search", icon:"🔍", label:"ネット検索（Google等）", sub:"GoogleやYahooで検索" },
  { value:"nearby", icon:"🚶", label:"通りがかり・近所", sub:"近くを通って・お近くにお住まい" },
  { value:"flyer", icon:"📄", label:"チラシ・看板", sub:"チラシや看板を見て" },
  { value:"other", icon:"✨", label:"その他", sub:"" },
];

const HeadOvalSVG = () => (
  <svg viewBox="0 0 200 200" width="100%" height="100%" style={{position:"absolute",top:0,left:0,pointerEvents:"none"}}>
    <ellipse cx="20" cy="100" rx="28" ry="46" fill="none" stroke="#CCCCCC" strokeWidth="1.5"/>
  </svg>
);

function DrawingCanvas({ savedData, onSave }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#333333");
  const [brushSize, setBrushSize] = useState("中");
  const [isEraser, setIsEraser] = useState(false);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const s = SALON_CONFIG;
  const brushSizes = { 細:2, 中:4, 太:8 };
  const isIPad = window.innerWidth >= 768;
  const canvasHeight = isIPad ? 320 : 180;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    if (savedData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
      img.src = savedData;
    }
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = useCallback((e) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current); }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "#F9F9F9" : color;
    ctx.lineWidth = isEraser ? (isIPad ? 28 : 18) : brushSizes[brushSize];
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos;
  }, [color, brushSize, isEraser]);

  const endDraw = useCallback(() => {
    if (drawing.current) { drawing.current = false; onSave(canvasRef.current.toDataURL()); }
  }, [onSave]);

  const clear = () => { const canvas = canvasRef.current; canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); onSave(null); };

  return (
    <div>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
        {[{val:"#333333"},{val:"#CC3333"},{val:"#3366CC"}].map(c=>(
          <button key={c.val} onClick={()=>{setColor(c.val);setIsEraser(false);}}
            style={{width:isIPad?34:28,height:isIPad?34:28,borderRadius:"50%",background:c.val,border:color===c.val&&!isEraser?"3px solid #333":"2px solid #DDD",cursor:"pointer"}}/>
        ))}
        <div style={{width:1,height:24,background:"#DDD",margin:"0 4px"}}/>
        {["細","中","太"].map(sz=>(
          <button key={sz} onClick={()=>setBrushSize(sz)}
            style={{background:brushSize===sz?s.accentLight:"#F5F5F5",color:brushSize===sz?s.accentDark:"#555",border:"none",borderRadius:6,padding:isIPad?"6px 14px":"4px 10px",fontSize:isIPad?14:12,fontWeight:600,cursor:"pointer"}}>{sz}</button>
        ))}
        <button onClick={()=>setIsEraser(!isEraser)}
          style={{background:isEraser?"#FFE8E8":"#F5F5F5",color:isEraser?"#FF5C5C":"#555",border:"none",borderRadius:6,padding:isIPad?"6px 14px":"4px 10px",fontSize:isIPad?14:12,fontWeight:600,cursor:"pointer"}}>消しゴム</button>
        <button onClick={clear}
          style={{background:"#FFF0F0",color:"#FF5C5C",border:"none",borderRadius:6,padding:isIPad?"6px 14px":"4px 10px",fontSize:isIPad?14:12,fontWeight:600,cursor:"pointer"}}>クリア</button>
      </div>
      <div style={{position:"relative",width:"100%",height:canvasHeight,borderRadius:10,border:"1px solid #E8E8E8",background:"#F9F9F9",overflow:"hidden",margin:"8px 0"}}>
        <HeadOvalSVG/>
        <canvas ref={canvasRef} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",touchAction:"none",cursor:isEraser?"cell":"crosshair"}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}/>
      </div>
      <div style={{fontSize:11,color:"#AAA",marginTop:4,textAlign:"center"}}>指またはApple Pencilで書き込めます</div>
    </div>
  );
}

function BirthdaySelector({ value, onChange }) {
  const parts = value ? value.split("-") : ["","",""];
  const [year, setYear] = useState(parts[0]||"");
  const [month, setMonth] = useState(parts[1]||"");
  const [day, setDay] = useState(parts[2]||"");
  const update = (y,m,d) => { if(y&&m&&d) onChange(`${y}-${m}-${d}`); else onChange(""); };
  const years = Array.from({length:80},(_,i)=>String(2010-i));
  const months = Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0"));
  const days = Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0"));
  const sel = (val,opts,ph,onCh) => (
    <select value={val} onChange={e=>onCh(e.target.value)}
      style={{flex:1,border:"1px solid #E8E8E8",borderRadius:8,padding:"10px 4px",fontSize:13,background:"#FAFAFA",outline:"none",color:val?"#333":"#AAA",appearance:"none",textAlign:"center"}}>
      <option value="">{ph}</option>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {sel(year,years,"年",v=>{setYear(v);update(v,month,day);})}
      <span style={{color:"#888",fontSize:12}}>年</span>
      {sel(month,months,"月",v=>{setMonth(v);update(year,v,day);})}
      <span style={{color:"#888",fontSize:12}}>月</span>
      {sel(day,days,"日",v=>{setDay(v);update(year,month,v);})}
      <span style={{color:"#888",fontSize:12}}>日</span>
    </div>
  );
}

// 来店日時セレクター（年月日＋時間）
function DateTimeSelector({ value, onChange }) {
  const s = SALON_CONFIG;
  const parse = (v) => {
    if (!v) return { year:"", month:"", day:"", hour:"", min:"" };
    const [date, time] = v.split(" ");
    const [year, month, day] = date.split("-");
    const [hour, min] = (time||"00:00").split(":");
    return { year, month, day, hour, min };
  };
  const [parts, setParts] = useState(parse(value));

  const update = (p) => {
    const n = {...parts, ...p};
    setParts(n);
    if(n.year&&n.month&&n.day) onChange(`${n.year}-${n.month}-${n.day} ${n.hour||"00"}:${n.min||"00"}`);
  };

  const years = Array.from({length:5},(_,i)=>String(2026-i));
  const months = Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0"));
  const days = Array.from({length:31},(_,i)=>String(i+1).padStart(2,"0"));
  const hours = Array.from({length:24},(_,i)=>String(i).padStart(2,"0"));
  const mins = ["00","10","20","30","40","50"];

  const sel = (val,opts,onCh,width) => (
    <select value={val} onChange={e=>onCh(e.target.value)}
      style={{width:width||"auto",border:"1px solid #E8E8E8",borderRadius:8,padding:"10px 4px",fontSize:13,background:"#FAFAFA",outline:"none",color:val?"#333":"#AAA",appearance:"none",textAlign:"center"}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div>
      <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:8}}>
        {sel(parts.year,years,v=>update({year:v}),"72px")}
        <span style={{color:"#888",fontSize:12}}>年</span>
        {sel(parts.month,months,v=>update({month:v}),"54px")}
        <span style={{color:"#888",fontSize:12}}>月</span>
        {sel(parts.day,days,v=>update({day:v}),"54px")}
        <span style={{color:"#888",fontSize:12}}>日</span>
      </div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {sel(parts.hour,hours,v=>update({hour:v}),"60px")}
        <span style={{color:"#888",fontSize:12}}>時</span>
        {sel(parts.min,mins,v=>update({min:v}),"60px")}
        <span style={{color:"#888",fontSize:12}}>分</span>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel="削除する", confirmColor="#FF5C5C" }) {
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:24}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:340,textAlign:"center"}}>
        <div style={{fontSize:14,color:"#333",marginBottom:20,lineHeight:1.7,whiteSpace:"pre-line"}}>{message}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,background:"#F5F5F5",color:"#555",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:600,cursor:"pointer"}}>キャンセル</button>
          <button onClick={onConfirm} style={{flex:1,background:confirmColor,color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function SalonKarte() {
  const s = SALON_CONFIG;
  const [loggedIn, setLoggedIn] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [screen, setScreen] = useState("list");
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [trash, setTrash] = useState([]);
  const [pending, setPending] = useState(PENDING_INIT);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [alertMonths, setAlertMonths] = useState(3);
  const [editingVisit, setEditingVisit] = useState(null);
  const [isNewVisit, setIsNewVisit] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editMemo, setEditMemo] = useState("");
  const [editStaff, setEditStaff] = useState("");
  const [editDrawing, setEditDrawing] = useState(null);
  const [editVisitPurchases, setEditVisitPurchases] = useState([]);
  const [editCustomer, setEditCustomer] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [newPurchaseName, setNewPurchaseName] = useState("");
  const [newPurchasePrice, setNewPurchasePrice] = useState("");
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [ciName, setCiName] = useState(""); const [ciKana, setCiKana] = useState(""); const [ciPhone, setCiPhone] = useState("");
  const [ciReferral, setCiReferral] = useState(""); const [ciBirthday, setCiBirthday] = useState("");
  const [ciEmail, setCiEmail] = useState(""); const [ciAddress, setCiAddress] = useState(""); const [ciMemo, setCiMemo] = useState("");
  const [ciError, setCiError] = useState(false);

  const filtered = customers.filter(c=>c.name.includes(search)||c.kana.includes(search)||c.phone.includes(search));
  const pad = n => String(n).padStart(2,"0");
  const nowStr = () => { const n=new Date(); return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())} ${pad(n.getHours())}:${pad(n.getMinutes())}`; };

  const handleLogin = () => { if(pwInput===s.password){setLoggedIn(true);setPwError(false);}else{setPwError(true);setPwInput("");} };
  const openDetail = (c) => { setSelectedCustomer(c); setScreen("detail"); };
  const openEditCustomer = (c) => { setEditCustomer({...c}); setScreen("editCustomer"); };
  const saveCustomer = () => { setCustomers(prev=>prev.map(c=>c.id===editCustomer.id?editCustomer:c)); setSelectedCustomer(editCustomer); setScreen("detail"); };

  const deleteCustomer = (customer) => {
    setConfirmDialog({ message:`「${customer.name}」のカルテを削除しますか？\nゴミ箱から復元できます。`, confirmLabel:"削除する", confirmColor:"#FF5C5C",
      onConfirm:()=>{ setTrash(prev=>[{...customer,deletedAt:new Date().toLocaleDateString("ja-JP")},...prev]); setCustomers(prev=>prev.filter(c=>c.id!==customer.id)); setConfirmDialog(null); setScreen("list"); },
      onCancel:()=>setConfirmDialog(null) });
  };

  const restoreCustomer = (customer) => { setCustomers(prev=>[{...customer,deletedAt:undefined},...prev]); setTrash(prev=>prev.filter(c=>c.id!==customer.id)); };

  const addVisit = () => {
    const d = nowStr();
    const newVisit = { id:Date.now(), date:d, tags:[], staff:"", memo:"", drawing:null, purchases:[] };
    setEditingVisit(newVisit); setIsNewVisit(true); setEditDate(d);
    setEditTags([]); setEditMemo(""); setEditStaff(""); setEditDrawing(null); setEditVisitPurchases([]);
    setScreen("editVisit");
  };

  const openEditVisit = (visit) => {
    setEditingVisit(visit); setIsNewVisit(false); setEditDate(visit.date);
    setEditTags(visit.tags); setEditMemo(visit.memo); setEditStaff(visit.staff);
    setEditDrawing(visit.drawing||null); setEditVisitPurchases(visit.purchases||[]);
    setScreen("editVisit");
  };

  const saveVisit = () => {
    setCustomers(prev=>prev.map(c=>{
      if(c.id!==selectedCustomer.id) return c;
      let updatedVisits;
      const saved = {...editingVisit, date:editDate, tags:editTags, memo:editMemo, staff:editStaff, drawing:editDrawing, purchases:editVisitPurchases};
      if(isNewVisit){ updatedVisits=[saved,...c.visits]; }
      else{ updatedVisits=c.visits.map(v=>v.id===editingVisit.id?saved:v); }
      const updated={...c,visits:updatedVisits}; setSelectedCustomer(updated); return updated;
    }));
    setIsNewVisit(false); setScreen("detail");
  };

  const handleBackFromEditVisit = () => {
    setConfirmDialog({ message:"保存せずに戻りますか？\n入力内容は破棄されます。", confirmLabel:"戻る", confirmColor:s.accent,
      onConfirm:()=>{ setConfirmDialog(null); setIsNewVisit(false); setScreen("detail"); },
      onCancel:()=>setConfirmDialog(null) });
  };

  const deleteVisit = (visitId) => {
    setConfirmDialog({ message:"この来店記録を削除しますか？", confirmLabel:"削除する", confirmColor:"#FF5C5C",
      onConfirm:()=>{ setCustomers(prev=>prev.map(c=>{ if(c.id!==selectedCustomer.id) return c; const updated={...c,visits:c.visits.filter(v=>v.id!==visitId)}; setSelectedCustomer(updated); return updated; })); setConfirmDialog(null); },
      onCancel:()=>setConfirmDialog(null) });
  };

  const addPurchaseToVisit = () => {
    if(!newPurchaseName) return;
    setEditVisitPurchases(prev=>[...prev,{id:Date.now(),name:newPurchaseName,price:Number(newPurchasePrice)||0,memo:""}]);
    setNewPurchaseName(""); setNewPurchasePrice(""); setShowAddPurchase(false);
  };

  const registerPending = (app) => {
    setCustomers(prev=>[{id:Date.now(),name:app.name,kana:app.kana,phone:app.phone,email:app.email,birthday:app.birthday,address:app.address,memo:app.memo,visits:[]},...prev]);
    setPending(prev=>prev.filter(p=>p.id!==app.id));
  };

  const submitCheckin = () => {
    if(!ciName||!ciKana||!ciPhone||!ciReferral){ setCiError(true); return; }
    setCiError(false); alert("送信しました！ありがとうございます。");
    setCiName(""); setCiKana(""); setCiPhone(""); setCiReferral(""); setCiBirthday(""); setCiEmail(""); setCiAddress(""); setCiMemo("");
  };

  const isListActive = ["list","detail","editCustomer","editVisit"].includes(screen);

  const Header = () => (
    <header style={{background:"#fff",borderBottom:"1px solid #EBEBEB",padding:"0 16px",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>{s.initial}</div>
          <span style={{fontWeight:700,fontSize:16,color:"#1A1A1A",letterSpacing:"0.05em"}}>{s.name}</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setScreen("checkin")} style={{background:s.accentLight,color:s.accentDark,border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>📋 お客様入力</button>
          <button onClick={()=>setScreen("pending")} style={{background:pending.length>0?"#FF5C5C":"#DDD",color:"#fff",border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>新規申請 {pending.length}件</button>
        </div>
      </div>
      <div style={{display:"flex",borderTop:"1px solid #F0F0F0"}}>
        {[{id:"list",label:"👥 顧客一覧",active:isListActive},{id:"alert",label:"🔔 失客アラート",active:screen==="alert"}].map(tab=>(
          <button key={tab.id} onClick={()=>setScreen(tab.id)} style={{flex:1,background:"none",border:"none",padding:"10px 0",fontSize:13,fontWeight:600,color:tab.active?s.accent:"#888",borderBottom:tab.active?`2px solid ${s.accent}`:"2px solid transparent",cursor:"pointer"}}>{tab.label}</button>
        ))}
      </div>
    </header>
  );

  // ===== ログイン =====
  if(!loggedIn) return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"100%",padding:32}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:s.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28,fontWeight:700,color:"#fff"}}>{s.initial}</div>
          <div style={{fontWeight:700,fontSize:22,letterSpacing:"0.08em"}}>{s.name}</div>
          <div style={{fontSize:13,color:"#888",marginTop:4}}>顧客管理システム</div>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:28,border:"1px solid #F0F0F0"}}>
          <div style={{fontSize:14,color:"#555",marginBottom:8,fontWeight:600}}>パスワード</div>
          <input type="password" value={pwInput} onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="パスワードを入力"
            style={{width:"100%",border:`1px solid ${pwError?"#FF5C5C":"#E8E8E8"}`,borderRadius:10,padding:"14px 16px",fontSize:16,outline:"none",boxSizing:"border-box",background:"#FAFAFA",marginBottom:8}}/>
          {pwError&&<div style={{color:"#FF5C5C",fontSize:12,marginBottom:8}}>パスワードが違います</div>}
          <button onClick={handleLogin} style={{width:"100%",background:s.accent,color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:4}}>ログイン</button>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:"#CCC",marginTop:16}}>デモ用パスワード：1234</div>
      </div>
    </div>
  );

  // ===== 顧客一覧 =====
  if(screen==="list") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>{confirmDialog&&<ConfirmDialog {...confirmDialog}/>}
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1,background:"#fff",border:"1px solid #E8E8E8",borderRadius:10,display:"flex",alignItems:"center",padding:"0 12px",gap:8}}>
            <span style={{color:"#AAA"}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="名前・ふりがな・携帯番号" style={{border:"none",outline:"none",width:"100%",fontSize:14,padding:"10px 0",background:"transparent"}}/>
          </div>
          <button style={{background:s.accent,color:"#fff",border:"none",borderRadius:10,padding:"0 14px",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>＋ 新規</button>
        </div>
        {filtered.map(c=>(
          <div key={c.id} onClick={()=>openDetail(c)} style={{background:"#fff",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px solid #F0F0F0",marginBottom:8}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:s.accentLight,color:s.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0}}>{c.name[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1A1A1A"}}>{c.name}</div>
              <div style={{fontSize:12,color:"#888",marginTop:2}}>{c.kana}　{c.phone}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:18,color:s.accent}}>{c.visits.length}</div>
              <div style={{fontSize:11,color:"#AAA"}}>来店</div>
            </div>
          </div>
        ))}
        {trash.length>0&&<button onClick={()=>setScreen("trash")} style={{width:"100%",background:"#fff",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px",fontSize:13,color:"#888",cursor:"pointer",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🗑️ ゴミ箱 ({trash.length}件)</button>}
        <button onClick={()=>setLoggedIn(false)} style={{width:"100%",background:"none",border:"none",padding:"16px",fontSize:12,color:"#CCC",cursor:"pointer"}}>ログアウト</button>
      </div>
    </div>
  );

  // ===== ゴミ箱 =====
  if(screen==="trash") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>setScreen("list")} style={{background:"none",border:"none",color:s.accent,fontSize:14,fontWeight:600,cursor:"pointer",padding:0,marginRight:12}}>← 戻る</button>
          <span style={{fontWeight:700,fontSize:16}}>🗑️ ゴミ箱 ({trash.length}件)</span>
        </div>
        {trash.length===0?(<div style={{background:s.accentLight,borderRadius:14,padding:32,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{color:s.accentDark,fontWeight:700,fontSize:16}}>ゴミ箱は空です</div></div>)
        :trash.map(c=>(
          <div key={c.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8,border:"1px solid #F0F0F0"}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"#F5F5F5",color:"#AAA",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>{c.name[0]}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15,color:"#555"}}>{c.name}</div><div style={{fontSize:12,color:"#AAA"}}>削除日：{c.deletedAt}</div></div>
            <button onClick={()=>restoreCustomer(c)} style={{background:s.accentLight,color:s.accentDark,border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>復元</button>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== 新規申請 =====
  if(screen==="pending") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>setScreen("list")} style={{background:"none",border:"none",color:s.accent,fontSize:14,fontWeight:600,cursor:"pointer",padding:0,marginRight:12}}>← 戻る</button>
          <span style={{fontWeight:700,fontSize:16}}>新規申請 {pending.length}件</span>
        </div>
        {pending.length===0?(<div style={{background:s.accentLight,borderRadius:14,padding:32,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{color:s.accentDark,fontWeight:700,fontSize:16}}>申請はありません</div></div>)
        :pending.map(app=>(
          <div key={app.id} style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #F0F0F0"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:"#FFF3E0",color:"#E65100",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>{app.name[0]}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{app.name}</div><div style={{fontSize:12,color:"#888"}}>{app.kana}　{app.phone}</div></div>
              <div style={{fontSize:11,color:"#AAA"}}>{app.submittedAt}</div>
            </div>
            <div style={{fontSize:13,color:"#666",marginBottom:4}}>来店のきっかけ：{app.referral}</div>
            {app.memo&&<div style={{fontSize:13,color:"#666",marginBottom:4}}>メモ：{app.memo}</div>}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>registerPending(app)} style={{flex:1,background:s.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>カルテに登録</button>
              <button onClick={()=>setPending(prev=>prev.filter(p=>p.id!==app.id))} style={{background:"#FFF0F0",color:"#FF5C5C",border:"none",borderRadius:8,padding:"10px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== カルテ詳細 =====
  if(screen==="detail"&&selectedCustomer) return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>{confirmDialog&&<ConfirmDialog {...confirmDialog}/>}
      <div style={{padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button onClick={()=>setScreen("list")} style={{background:"none",border:"none",color:s.accent,fontSize:14,fontWeight:600,cursor:"pointer",padding:0}}>← 一覧</button>
          <span style={{fontWeight:700,fontSize:16}}>カルテ詳細</span>
          <button onClick={()=>openEditCustomer(selectedCustomer)} style={{background:s.accentLight,color:s.accentDark,border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>✏️ 編集</button>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:12,border:"1px solid #F0F0F0"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:s.accentLight,color:s.accent,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:20}}>{selectedCustomer.name[0]}</div>
            <div><div style={{fontWeight:700,fontSize:18}}>{selectedCustomer.name}</div><div style={{fontSize:13,color:"#888"}}>{selectedCustomer.kana}</div></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:14,color:"#555"}}>
            <div>📱 {selectedCustomer.phone}</div>
            {selectedCustomer.email&&<div>✉️ {selectedCustomer.email}</div>}
            {selectedCustomer.birthday&&<div>🎂 {selectedCustomer.birthday}</div>}
            {selectedCustomer.address&&<div>🏠 {selectedCustomer.address}</div>}
            {selectedCustomer.memo&&<div>📝 {selectedCustomer.memo}</div>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}>
            <div style={{background:s.accentLight,borderRadius:10,padding:12,textAlign:"center"}}><div style={{fontWeight:700,fontSize:18,color:s.accent}}>{selectedCustomer.visits.length}回</div><div style={{fontSize:11,color:"#888",marginTop:2}}>来店回数</div></div>
            <div style={{background:s.accentLight,borderRadius:10,padding:12,textAlign:"center"}}><div style={{fontWeight:700,fontSize:13,color:s.accent}}>{selectedCustomer.visits.length>0?selectedCustomer.visits[0].date.split(" ")[0]:"なし"}</div><div style={{fontSize:11,color:"#888",marginTop:2}}>最終来店</div></div>
          </div>
          <button onClick={()=>deleteCustomer(selectedCustomer)} style={{marginTop:14,background:"none",border:"1px solid #FF5C5C",color:"#FF5C5C",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>このお客様を削除</button>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #F0F0F0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:15}}>✂️ 来店履歴</span>
            <button onClick={addVisit} style={{background:s.accent,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>✂️ 記録する</button>
          </div>
          {selectedCustomer.visits.length===0?(<div style={{textAlign:"center",color:"#AAA",padding:"20px 0",fontSize:13}}>来店記録がありません</div>):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {selectedCustomer.visits.map(v=>(
                <div key={v.id} style={{border:`1px solid ${s.accentLight}`,borderRadius:10,padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{color:s.accent,fontWeight:600,fontSize:13}}>📅 {v.date}</span>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>openEditVisit(v)} style={{background:"#F5F5F5",border:"none",borderRadius:6,padding:"3px 10px",fontSize:12,cursor:"pointer"}}>編集</button>
                      <button onClick={()=>deleteVisit(v.id)} style={{background:"#FFF0F0",color:"#FF5C5C",border:"none",borderRadius:6,padding:"3px 10px",fontSize:12,cursor:"pointer"}}>削除</button>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{v.tags.map(tag=><span key={tag} style={{background:s.accentLight,color:s.accentDark,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600}}>{tag}</span>)}</div>
                  {v.memo&&<div style={{fontSize:13,color:"#666",marginBottom:4}}>メモ　{v.memo}</div>}
                  {v.staff&&<div style={{fontSize:12,color:"#AAA",marginBottom:4}}>担当：{v.staff}</div>}
                  {v.drawing&&<img src={v.drawing} alt="展開図" style={{width:"100%",borderRadius:8,marginBottom:8,border:"1px solid #EEE"}}/>}
                  {(v.purchases||[]).length>0&&(
                    <div style={{background:"#FAFAFA",borderRadius:8,padding:"10px 12px",marginTop:6}}>
                      <div style={{fontSize:12,color:"#888",marginBottom:6,fontWeight:600}}>🛍️ 購入商品</div>
                      {v.purchases.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#555",marginBottom:2}}><span>{p.name}</span><span style={{fontWeight:600,color:s.accent}}>¥{p.price.toLocaleString()}</span></div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===== 顧客情報編集 =====
  if(screen==="editCustomer"&&editCustomer) return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>setScreen("detail")} style={{background:"none",border:"none",color:s.accent,fontSize:14,fontWeight:600,cursor:"pointer",padding:0,marginRight:12}}>← 戻る</button>
          <span style={{fontWeight:700,fontSize:16}}>お客様情報を編集</span>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #F0F0F0"}}>
          {[{label:"お名前",key:"name",required:true,placeholder:"山田 花子"},{label:"ふりがな",key:"kana",required:true,placeholder:"やまだ はなこ"},{label:"携帯番号",key:"phone",required:true,placeholder:"09012345678"},{label:"メールアドレス",key:"email",required:false,placeholder:"example@email.com"},{label:"ご住所",key:"address",required:false,placeholder:"群馬県○○市..."},{label:"メモ・特記事項",key:"memo",required:false,placeholder:"アレルギーや頭皮のお悩みなど",textarea:true}].map(field=>(
            <div key={field.key} style={{marginBottom:16}}>
              <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>{field.label}{field.required?<span style={{background:s.accent,color:"#fff",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:700}}>必須</span>:<span style={{background:"#F0F0F0",color:"#888",fontSize:10,borderRadius:4,padding:"1px 6px"}}>任意</span>}</div>
              {field.textarea?<textarea value={editCustomer[field.key]||""} onChange={e=>setEditCustomer({...editCustomer,[field.key]:e.target.value})} placeholder={field.placeholder} rows={3} style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA",resize:"none"}}/>
              :<input value={editCustomer[field.key]||""} onChange={e=>setEditCustomer({...editCustomer,[field.key]:e.target.value})} placeholder={field.placeholder} style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA"}}/>}
            </div>
          ))}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>生年月日 <span style={{background:"#F0F0F0",color:"#888",fontSize:10,borderRadius:4,padding:"1px 6px"}}>任意</span></div>
            <BirthdaySelector value={editCustomer.birthday||""} onChange={val=>setEditCustomer({...editCustomer,birthday:val})}/>
          </div>
          <button onClick={saveCustomer} style={{width:"100%",background:s.accent,color:"#fff",border:"none",borderRadius:12,padding:15,fontSize:16,fontWeight:700,cursor:"pointer"}}>保存する</button>
        </div>
      </div>
    </div>
  );

  // ===== 来店記録編集 =====
  if(screen==="editVisit") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      {confirmDialog&&<ConfirmDialog {...confirmDialog}/>}<Header/>
      <div style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
          <button onClick={handleBackFromEditVisit} style={{background:"none",border:"none",color:s.accent,fontSize:14,fontWeight:600,cursor:"pointer",padding:0,marginRight:12}}>← 戻る</button>
          <span style={{fontWeight:700,fontSize:16}}>{isNewVisit?"来店記録を追加":"来店記録を編集"}</span>
        </div>
        <div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #F0F0F0"}}>
          {/* 日付変更 */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:8,fontWeight:600}}>来店日時</div>
            <DateTimeSelector value={editDate} onChange={setEditDate}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:8,fontWeight:600}}>施術タグ（複数選択可）</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {s.visitTags.map(tag=>(
                <button key={tag} onClick={()=>setEditTags(prev=>prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag])}
                  style={{background:editTags.includes(tag)?s.accent:"#F5F5F5",color:editTags.includes(tag)?"#fff":"#555",border:"none",borderRadius:20,padding:"6px 12px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{tag}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:8,fontWeight:600}}>担当スタッフ</div>
            <input value={editStaff} onChange={e=>setEditStaff(e.target.value)} placeholder="例）田中" style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:8,fontWeight:600}}>メモ・施術詳細</div>
            <textarea value={editMemo} onChange={e=>setEditMemo(e.target.value)} rows={4} placeholder="カラー詳細・お客様の要望など" style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA",resize:"none"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:8,fontWeight:600}}>✏️ 頭部展開図（手書き）</div>
            <DrawingCanvas savedData={editDrawing} onSave={data=>setEditDrawing(data)}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:13,color:"#555",fontWeight:600}}>🛍️ 購入商品</div>
              <button onClick={()=>setShowAddPurchase(!showAddPurchase)} style={{background:s.accentLight,color:s.accentDark,border:"none",borderRadius:6,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>＋ 追加</button>
            </div>
            {showAddPurchase&&(
              <div style={{background:"#FAFAFA",borderRadius:10,padding:12,marginBottom:10,border:"1px solid #E8E8E8"}}>
                <input value={newPurchaseName} onChange={e=>setNewPurchaseName(e.target.value)} placeholder="商品名" style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff",marginBottom:8}}/>
                <input value={newPurchasePrice} onChange={e=>setNewPurchasePrice(e.target.value)} placeholder="金額（円）" type="number" style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:8,padding:"10px 12px",fontSize:13,outline:"none",boxSizing:"border-box",background:"#fff",marginBottom:8}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={addPurchaseToVisit} style={{flex:1,background:s.accent,color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>追加</button>
                  <button onClick={()=>setShowAddPurchase(false)} style={{background:"#F5F5F5",color:"#555",border:"none",borderRadius:8,padding:"10px 14px",fontSize:13,cursor:"pointer"}}>戻る</button>
                </div>
              </div>
            )}
            {editVisitPurchases.length===0&&!showAddPurchase?<div style={{fontSize:13,color:"#AAA",textAlign:"center",padding:"10px 0"}}>購入商品なし</div>
            :editVisitPurchases.map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #F5F5F5"}}>
                <span style={{fontSize:13}}>{p.name}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:600,fontSize:13,color:s.accent}}>¥{p.price.toLocaleString()}</span>
                  <button onClick={()=>setEditVisitPurchases(prev=>prev.filter(x=>x.id!==p.id))} style={{background:"#FFF0F0",color:"#FF5C5C",border:"none",borderRadius:6,padding:"3px 8px",fontSize:11,cursor:"pointer"}}>削除</button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveVisit} style={{width:"100%",background:s.accent,color:"#fff",border:"none",borderRadius:12,padding:15,fontSize:16,fontWeight:700,cursor:"pointer"}}>更新する</button>
        </div>
      </div>
    </div>
  );

  // ===== 失客アラート =====
  if(screen==="alert") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#F7F7F5",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <Header/>
      <div style={{padding:16}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>🔔 失客アラート</div>
        <div style={{background:"#fff",borderRadius:14,padding:20,marginBottom:16,border:"1px solid #F0F0F0"}}>
          <div style={{textAlign:"center",fontSize:15,marginBottom:16}}>アラート期間：<span style={{color:s.accent,fontWeight:700}}>{alertMonths}ヶ月</span>以上来店なし</div>
          <input type="range" min="1" max="12" value={alertMonths} onChange={e=>setAlertMonths(Number(e.target.value))} style={{width:"100%",accentColor:s.accent,marginBottom:8}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n=><span key={n} style={{color:n===alertMonths?s.accent:"#CCC",fontWeight:n===alertMonths?700:400}}>{n}</span>)}</div>
        </div>
        {(()=>{ const now=new Date(); const alerted=customers.filter(c=>{ if(c.visits.length===0) return true; return (now-new Date(c.visits[0].date))/(1000*60*60*24*30)>=alertMonths; });
          return alerted.length===0?(<div style={{background:s.accentLight,borderRadius:14,padding:32,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🎉</div><div style={{color:s.accentDark,fontWeight:700,fontSize:16}}>失客アラートなし！</div></div>)
          :alerted.map(c=>(<div key={c.id} onClick={()=>openDetail(c)} style={{background:"#fff",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8,border:"1px solid #FFE8E8",cursor:"pointer"}}><div style={{width:42,height:42,borderRadius:"50%",background:"#FFF0F0",color:"#FF5C5C",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>{c.name[0]}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{c.name}</div><div style={{fontSize:12,color:"#888"}}>最終来店 {c.visits.length>0?c.visits[0].date.split(" ")[0]:"記録なし"}</div></div></div>));
        })()}
      </div>
    </div>
  );

  // ===== チェックイン =====
  if(screen==="checkin") return (
    <div style={{fontFamily:"'Noto Sans JP',sans-serif",background:"#fff",minHeight:"100vh",maxWidth:430,margin:"0 auto"}}>
      <div style={{background:s.accent,padding:"32px 24px 28px",textAlign:"center",position:"relative"}}>
        <button onClick={()=>setScreen("list")} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>← スタッフ画面</button>
        <div style={{width:56,height:56,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:24,fontWeight:700,color:"#fff"}}>{s.initial}</div>
        <div style={{color:"#fff",fontWeight:700,fontSize:20,letterSpacing:"0.1em"}}>{s.name}</div>
        <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,marginTop:3}}>{s.tagline}</div>
      </div>
      <div style={{padding:24}}>
        <h2 style={{textAlign:"center",fontSize:18,fontWeight:700,marginBottom:4}}>ご来店ありがとうございます</h2>
        <p style={{textAlign:"center",color:"#888",fontSize:13,marginBottom:24}}>はじめてのお客様は以下をご記入ください</p>
        {ciError&&<div style={{background:"#FFF0F0",border:"1px solid #FFCCCC",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#FF5C5C",marginBottom:16}}>必須項目を入力してください</div>}
        {[{label:"お名前",val:ciName,set:setCiName,required:true,placeholder:"山田 花子"},{label:"ふりがな",val:ciKana,set:setCiKana,required:true,placeholder:"やまだ はなこ"},{label:"携帯番号",val:ciPhone,set:setCiPhone,required:true,placeholder:"09012345678"}].map(f=>(
          <div key={f.label} style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>{f.label}<span style={{background:s.accent,color:"#fff",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:700}}>必須</span></div>
            <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{width:"100%",border:`1px solid ${ciError&&!f.val?"#FF5C5C":"#E8E8E8"}`,borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA"}}/>
          </div>
        ))}
        {/* 来店のきっかけ（必須・更新済み） */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,color:"#555",marginBottom:10,display:"flex",gap:6,alignItems:"center"}}>来店のきっかけ <span style={{background:s.accent,color:"#fff",fontSize:10,borderRadius:4,padding:"1px 6px",fontWeight:700}}>必須</span></div>
          {ciError&&!ciReferral&&<div style={{fontSize:12,color:"#FF5C5C",marginBottom:8}}>選択してください</div>}
          {REFERRAL_OPTIONS.map(opt=>(
            <div key={opt.value} onClick={()=>setCiReferral(opt.value)}
              style={{display:"flex",alignItems:"center",gap:14,border:`1px solid ${ciReferral===opt.value?s.accent:ciError&&!ciReferral?"#FFCCCC":"#E8E8E8"}`,borderRadius:10,padding:"12px 14px",marginBottom:8,background:ciReferral===opt.value?s.accentLight:"#FAFAFA",cursor:"pointer"}}>
              <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${ciReferral===opt.value?s.accent:"#CCC"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {ciReferral===opt.value&&<div style={{width:10,height:10,borderRadius:"50%",background:s.accent}}/>}
              </div>
              <span style={{fontSize:16}}>{opt.icon}</span>
              <div><div style={{fontSize:14,fontWeight:600,color:"#1A1A1A"}}>{opt.label}</div>{opt.sub&&<div style={{fontSize:12,color:"#888"}}>{opt.sub}</div>}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>生年月日 <span style={{background:"#F0F0F0",color:"#888",fontSize:10,borderRadius:4,padding:"1px 6px"}}>任意</span></div>
          <BirthdaySelector value={ciBirthday} onChange={setCiBirthday}/>
        </div>
        {[{label:"メールアドレス",val:ciEmail,set:setCiEmail,placeholder:"example@email.com"},{label:"ご住所",val:ciAddress,set:setCiAddress,placeholder:"群馬県○○市..."}].map(f=>(
          <div key={f.label} style={{marginBottom:16}}>
            <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>{f.label}<span style={{background:"#F0F0F0",color:"#888",fontSize:10,borderRadius:4,padding:"1px 6px"}}>任意</span></div>
            <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.placeholder} style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA"}}/>
          </div>
        ))}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:13,color:"#555",marginBottom:6,display:"flex",gap:6,alignItems:"center"}}>アレルギー・特記事項 <span style={{background:"#F0F0F0",color:"#888",fontSize:10,borderRadius:4,padding:"1px 6px"}}>任意</span></div>
          <textarea value={ciMemo} onChange={e=>setCiMemo(e.target.value)} placeholder="アレルギーや頭皮のお悩みなど" rows={3} style={{width:"100%",border:"1px solid #E8E8E8",borderRadius:10,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",background:"#FAFAFA",resize:"none"}}/>
        </div>
        <button onClick={submitCheckin} style={{width:"100%",background:s.accent,color:"#fff",border:"none",borderRadius:12,padding:15,fontSize:16,fontWeight:700,cursor:"pointer"}}>送信する</button>
        <p style={{textAlign:"center",fontSize:11,color:"#CCC",marginTop:12}}>ご入力いただいた情報は{s.name}が適切に管理いたします</p>
      </div>
    </div>
  );

  return null;
}
