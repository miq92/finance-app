import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// ─── Static / Reference Data ──────────────────────────────────────────────────
const CATEGORY_ICONS = { Food:"🍽️", Transport:"🚕", Groceries:"🛒", Utilities:"⚡", Entertainment:"🎬", Health:"💊", Shopping:"🛍️", Other:"📦" };

const ANNUAL_DATA = [
  { month:"Jan", expenses:2240, savings:1100, ev:105 },
  { month:"Feb", expenses:1980, savings:1350, ev:98  },
  { month:"Mar", expenses:2410, savings:980,  ev:115 },
  { month:"Apr", expenses:2150, savings:1180, ev:72  },
  { month:"May", expenses:1405, savings:890,  ev:31  },
  { month:"Jun", expenses:0,    savings:0,    ev:0   },
  { month:"Jul", expenses:0,    savings:0,    ev:0   },
  { month:"Aug", expenses:0,    savings:0,    ev:0   },
  { month:"Sep", expenses:0,    savings:0,    ev:0   },
  { month:"Oct", expenses:0,    savings:0,    ev:0   },
  { month:"Nov", expenses:0,    savings:0,    ev:0   },
  { month:"Dec", expenses:0,    savings:0,    ev:0   },
];
const CATEGORY_ANNUAL = [
  { name:"Food",         amount:3240, color:"#f97316", pct:28 },
  { name:"Transport",    amount:2380, color:"#3b82f6", pct:21 },
  { name:"Utilities",    amount:1820, color:"#eab308", pct:16 },
  { name:"Groceries",    amount:1560, color:"#22c55e", pct:14 },
  { name:"Health",       amount:980,  color:"#ec4899", pct:9  },
  { name:"Entertainment",amount:680,  color:"#a855f7", pct:6  },
  { name:"Other",        amount:680,  color:"#64748b", pct:6  },
];
const BILLING_DATA = [
  { month:"Dec", cost:88 },{ month:"Jan", cost:105 },{ month:"Feb", cost:98 },
  { month:"Mar", cost:115 },{ month:"Apr", cost:72  },{ month:"May", cost:31, current:true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => Number(n).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2});
function fmtDate(iso) {
  if (!iso) return "";
  if (iso.slice(0,10)==="2026-05-22") return "Today";
  if (iso.slice(0,10)==="2026-05-21") return "Yesterday";
  return new Date(iso).toLocaleDateString("en-MY",{weekday:"short",day:"numeric",month:"short"});
}

// ─── UI Primitives ────────────────────────────────────────────────────────────
function CircleScore({ score, dark }) {
  const r=38, circ=2*Math.PI*r;
  const color = score>=80?"#22c55e":score>=60?"#f97316":"#ef4444";
  return (
    <svg width={90} height={90} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={dark?"#1e293b":"#e2e8f0"} strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${circ*(score/100)} ${circ*(1-score/100)}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{transition:"stroke-dasharray 1s ease"}}/>
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="20" fontWeight="700" fontFamily="Sora,sans-serif">{score}</text>
      <text x="50" y="62" textAnchor="middle" fill={dark?"#64748b":"#94a3b8"} fontSize="10" fontFamily="Sora,sans-serif">FAIR</text>
    </svg>
  );
}
function ScoreBar({label,score,max,detail,color,dark}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:dark?"#94a3b8":"#64748b"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:dark?"#e2e8f0":"#1e293b"}}>{score}/{max}</span>
      </div>
      <div style={{height:6,background:dark?"#1e293b":"#e2e8f0",borderRadius:99}}>
        <div style={{height:"100%",width:`${(score/max)*100}%`,background:color,borderRadius:99,transition:"width 1s ease"}}/>
      </div>
      <p style={{fontSize:11,color:dark?"#475569":"#94a3b8",marginTop:3}}>{detail}</p>
    </div>
  );
}
function Modal({open,onClose,title,dark,children}) {
  if(!open) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:dark?"#0f172a":"#fff",borderRadius:"24px 24px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",animation:"slideUp 0.3s ease",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:800,color:dark?"#f1f5f9":"#0f172a"}}>{title}</h3>
          <button onClick={onClose} style={{background:dark?"#1e293b":"#f1f5f9",border:"none",borderRadius:99,width:30,height:30,cursor:"pointer",fontSize:14,color:dark?"#94a3b8":"#64748b"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Input({label,value,onChange,type="text",prefix,dark,step,placeholder}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:12,color:dark?"#94a3b8":"#64748b",display:"block",marginBottom:6,fontWeight:600}}>{label}</label>}
      <div style={{display:"flex",alignItems:"center",background:dark?"#1e293b":"#f8fafc",borderRadius:12,border:`1px solid ${dark?"#334155":"#e2e8f0"}`,overflow:"hidden"}}>
        {prefix&&<span style={{padding:"0 12px",color:dark?"#64748b":"#94a3b8",fontSize:14}}>{prefix}</span>}
        <input type={type} value={value} onChange={onChange} step={step} placeholder={placeholder}
          style={{flex:1,background:"transparent",border:"none",outline:"none",padding:"12px",fontSize:15,color:dark?"#f1f5f9":"#0f172a",fontFamily:"Sora,sans-serif"}}/>
      </div>
    </div>
  );
}
function Select({label,value,onChange,options,dark}) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{fontSize:12,color:dark?"#94a3b8":"#64748b",display:"block",marginBottom:6,fontWeight:600}}>{label}</label>}
      <select value={value} onChange={onChange} style={{width:"100%",background:dark?"#1e293b":"#f8fafc",border:`1px solid ${dark?"#334155":"#e2e8f0"}`,borderRadius:12,padding:"12px",fontSize:15,color:dark?"#f1f5f9":"#0f172a",fontFamily:"Sora,sans-serif",outline:"none",cursor:"pointer"}}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Btn({onClick,children,variant="primary",dark,style={}}) {
  const bg = variant==="primary"?"linear-gradient(135deg,#6366f1,#7c3aed)":dark?"#1e293b":"#f1f5f9";
  const col = variant==="primary"?"#fff":dark?"#94a3b8":"#64748b";
  return (
    <button onClick={onClick} style={{background:bg,border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,color:col,cursor:"pointer",fontFamily:"Sora,sans-serif",width:"100%",letterSpacing:0.3,...style}}>{children}</button>
  );
}

// Loading skeleton
function Skeleton({h=16,w="100%",dark}) {
  return <div style={{height:h,width:w,borderRadius:8,background:dark?"#1e293b":"#e2e8f0",animation:"pulse 1.5s ease infinite",marginBottom:8}}/>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FinanceApp() {
  const [dark, setDark] = useState(true);
  const [tab, setTab]   = useState("dashboard");
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [dbError, setDbError]   = useState(null);

  // Data state
  const [loans,      setLoans]      = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [checklist,  setChecklist]  = useState([]);
  const [evSessions, setEvSessions] = useState([]);

  // Settings
  const [incomeSources,    setIncomeSources]    = useState([
    { id:"main",  name:"Main Income", amount:6240, icon:"💼", color:"#6366f1" },
    { id:"locum", name:"Locum",       amount:0,    icon:"🏥", color:"#22c55e" },
  ]);
  const [editingIncomeSource, setEditingIncomeSource] = useState(null);
  const [monthlyBudget,  setMonthlyBudget]  = useState(2400);
  const [cutoffDay,      setCutoffDay]      = useState(17);

  // UI state
  const [modal,                setModal]                = useState(null);
  const [form,                 setForm]                 = useState({});
  const [editingLoan,          setEditingLoan]          = useState(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [editingSession,       setEditingSession]       = useState(null);
  const [showAllChecklist,     setShowAllChecklist]     = useState(false);
  const [checklistEditMode,    setChecklistEditMode]    = useState(false);

  const d = dark;
  const bg    = d?"#020617":"#f8fafc";
  const card  = d?"#0f172a":"#ffffff";
  const border= d?"#1e293b":"#e2e8f0";
  const text  = d?"#f1f5f9":"#0f172a";
  const sub   = d?"#475569":"#94a3b8";
  const navBg = d?"#0a0f1e":"#ffffff";

  // ── Load all data from Supabase on mount ────────────────────────────────────
  useEffect(()=>{ loadAll(); },[]);

  async function loadAll() {
    setLoading(true); setDbError(null);
    try {
      const [
        {data:loansData,    error:e1},
        {data:expData,      error:e2},
        {data:checkData,    error:e3},
        {data:evData,       error:e4},
        {data:settingsData, error:e5},
        {data:incomeData,   error:e6},
      ] = await Promise.all([
        supabase.from("loans").select("*").order("id"),
        supabase.from("expenses").select("*").order("date",{ascending:false}),
        supabase.from("checklist").select("*").order("sort_order"),
        supabase.from("ev_sessions").select("*").order("id",{ascending:false}),
        supabase.from("settings").select("*"),
        supabase.from("income_sources").select("*").order("sort_order"),
      ]);
      const err = e1||e2||e3||e4||e5||e6;
      if(err) throw err;
      setLoans(loansData||[]);
      setExpenses(expData||[]);
      setChecklist(checkData||[]);
      setEvSessions(evData||[]);
      if(incomeData&&incomeData.length>0) setIncomeSources(incomeData);
      if(settingsData) {
        const s = Object.fromEntries(settingsData.map(r=>[r.key,r.value]));
        if(s.monthly_budget) setMonthlyBudget(+s.monthly_budget);
        if(s.cutoff_day)     setCutoffDay(+s.cutoff_day);
      }
    } catch(err) {
      setDbError("Could not connect to Supabase. Check your URL & API key in supabase.js");
      console.error(err);
    }
    setLoading(false);
  }

  async function saveSetting(key, value) {
    await supabase.from("settings").upsert({key, value:String(value), updated_at:new Date().toISOString()});
  }
  function withSync(fn) {
    return async(...args)=>{ setSyncing(true); await fn(...args); setSyncing(false); };
  }

  // ── Computed values ─────────────────────────────────────────────────────────
  const netIncome  = incomeSources.reduce((s,i)=>s+Number(i.amount),0);
  const totalSpent = expenses.reduce((s,e)=>s+Number(e.amount),0);
  const paidCount  = checklist.filter(i=>i.paid).length;
  const totalLoans = loans.reduce((s,l)=>s+Number(l.total),0);
  const dsrRatio   = netIncome>0?((loans.reduce((s,l)=>s+Number(l.monthly),0)/netIncome)*100).toFixed(1):"0";

  // ── Expense actions ─────────────────────────────────────────────────────────
  const saveExpense = withSync(async()=>{
    const cat = form.category||"Food";
    const row = { name:form.name||"Expense", category:cat, icon:CATEGORY_ICONS[cat]||"📦",
      amount:+form.amount||0, date:new Date().toISOString().slice(0,10),
      time:new Date().toLocaleTimeString("en-MY",{hour:"2-digit",minute:"2-digit"}) };
    const {data,error} = await supabase.from("expenses").insert(row).select().single();
    if(error) console.error("Expense insert error:",error.message);
    setExpenses(prev=>[data||{...row,id:Date.now()},...prev]);
    setModal(null); setForm({});
  });

  // ── Loan actions ────────────────────────────────────────────────────────────
  const openEditLoan = (loan)=>{ setEditingLoan(loan); setForm({...loan}); setModal("editLoan"); };
  const openAddLoan  = ()=>{ setForm({name:"",type:"Personal",icon:"💳",monthly:"",total:"",paid:0,payoff:"",months:"",color:"#6366f1",due:false}); setModal("addLoan"); };
  const saveLoan = withSync(async()=>{
    const row = {...form, monthly:+form.monthly, total:+form.total, paid:+form.paid, months:+form.months};
    if(modal==="editLoan") {
      await supabase.from("loans").update(row).eq("id",editingLoan.id);
      setLoans(prev=>prev.map(l=>l.id===editingLoan.id?{...l,...row}:l));
    } else {
      const {data,error} = await supabase.from("loans").insert(row).select().single();
      if(error) console.error("Loan insert error:",error.message);
      setLoans(prev=>[...prev, data||{...row,id:Date.now()}]);
    }
    setModal(null);
  });
  const deleteLoan = withSync(async(id)=>{
    await supabase.from("loans").delete().eq("id",id);
    setLoans(prev=>prev.filter(l=>l.id!==id));
    setModal(null);
  });

  // ── Checklist actions ───────────────────────────────────────────────────────
  const toggleChecklist = async (item) => {
    const newVal = !item.paid;
    // Optimistic update — instant, no sync spinner
    setChecklist(prev=>prev.map(i=>i.id===item.id?{...i,paid:newVal}:i));
    const {error} = await supabase.from("checklist").update({paid:newVal}).eq("id",item.id);
    if(error) console.error("Checklist toggle error:",error.message);
  };
  const saveChecklistItem = withSync(async()=>{
    if(!form.name?.trim()) return;
    if(editingChecklistItem) {
      const upd = {
        name: form.name.trim(),
        amount: form.amount !== "" ? +form.amount : editingChecklistItem.amount,
        due_date: form.due_date || null
      };
      const {error} = await supabase.from("checklist").update(upd).eq("id",editingChecklistItem.id);
      if(error) console.error("Checklist update error:",error.message);
      setChecklist(prev=>prev.map(i=>i.id===editingChecklistItem.id?{...i,...upd}:i));
    } else {
      const row = {
        name: form.name.trim(),
        amount: form.amount !== "" ? +form.amount : 0,
        due_date: form.due_date || null,
        paid: false,
        sort_order: checklist.length + 1
      };
      const {data,error} = await supabase.from("checklist").insert(row).select().single();
      if(error) console.error("Checklist insert error:",error.message);
      setChecklist(prev=>[data||{...row,id:Date.now()}, ...prev]);
      setShowAllChecklist(true);
    }
    setModal(null); setForm({});
  });
  const deleteChecklistItem = withSync(async(id)=>{
    const {error} = await supabase.from("checklist").delete().eq("id",id);
    if(error) console.error("Checklist delete error:",error.message);
    setChecklist(prev=>prev.filter(i=>i.id!==id));
    setModal(null);
  });

  // ── EV actions ──────────────────────────────────────────────────────────────
  const formatEvDate = (iso) => {
    if(!iso) return "Today";
    // If already a display string like "26 Apr", return as-is
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return new Date(iso).toLocaleDateString("en-MY",{day:"numeric",month:"short",year:"numeric"});
  };
  const saveEvSession = withSync(async()=>{
    const displayDate = formatEvDate(form.date);
    const row = {
      date: displayDate,
      kwh:+form.kwh||0,
      rate:+form.rate||0,
      cost:(+form.kwh||0)*(+form.rate||0),
      charger:form.charger||"",
      duration:form.duration||"—",
      type:form.type||"AC"
    };
    if(editingSession) {
      const {error} = await supabase.from("ev_sessions").update(row).eq("id",editingSession.id);
      if(error) console.error("EV update error:",error.message);
      // Always update local state regardless of Supabase result
      setEvSessions(prev=>prev.map(s=>s.id===editingSession.id?{...s,...row}:s));
    } else {
      const {data, error} = await supabase.from("ev_sessions").insert(row).select().single();
      if(error) {
        console.error("EV insert error:",error.message);
        // Fallback: save to local state with temp id so user sees it immediately
        setEvSessions(prev=>[{...row, id:Date.now()},...prev]);
      } else if(data) {
        setEvSessions(prev=>[data,...prev]);
      }
    }
    setModal(null); setForm({});
  });
  const deleteEvSession = withSync(async(id)=>{
    await supabase.from("ev_sessions").delete().eq("id",id);
    setEvSessions(prev=>prev.filter(s=>s.id!==id));
    setModal(null);
  });

  // ── Income source actions ───────────────────────────────────────────────────
  const saveIncomeSource = withSync(async()=>{
    const row = { name:form.name||"Income", amount:+form.amount||0, icon:form.icon||"💼", color:form.color||"#6366f1", sort_order:form.sort_order||incomeSources.length+1 };
    if(editingIncomeSource && typeof editingIncomeSource.id==="number") {
      await supabase.from("income_sources").update(row).eq("id",editingIncomeSource.id);
      setIncomeSources(prev=>prev.map(s=>s.id===editingIncomeSource.id?{...s,...row}:s));
    } else {
      const {data} = await supabase.from("income_sources").insert(row).select().single();
      if(data) setIncomeSources(prev=>[...prev,data]);
      else setIncomeSources(prev=>[...prev,{...row,id:Date.now()}]);
    }
    setModal(null); setForm({});
  });
  const deleteIncomeSource = withSync(async(id)=>{
    if(typeof id==="number") await supabase.from("income_sources").delete().eq("id",id);
    setIncomeSources(prev=>prev.filter(s=>s.id!==id));
    setModal(null);
  });

  // ── Settings save ───────────────────────────────────────────────────────────
  const saveBudget = withSync(async()=>{
    const mb=+form.monthlyBudget||monthlyBudget;
    await saveSetting("monthly_budget",mb);
    setMonthlyBudget(mb); setModal(null);
  });
  const saveEvSettings = withSync(async()=>{
    const c=+form.cutoffDay||cutoffDay;
    await saveSetting("cutoff_day",c);
    setCutoffDay(c); setModal(null);
  });

  // Group expenses by date label
  const groupedExpenses = expenses.reduce((acc,e)=>{
    const k=fmtDate(e.date); if(!acc[k]) acc[k]=[];
    acc[k].push(e); return acc;
  },{});

  const tabs = [
    {id:"dashboard",label:"Dashboard",icon:"⊞"},
    {id:"expenses", label:"Expenses",  icon:"💲"},
    {id:"loans",    label:"Loans",     icon:"💳"},
    {id:"ev",       label:"EV",        icon:"⚡"},
    {id:"annual",   label:"Annual",    icon:"📊"},
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Sora',sans-serif",background:bg,minHeight:"100vh",color:text,maxWidth:480,margin:"0 auto",position:"relative",paddingBottom:84,transition:"background 0.3s,color 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .fade-up{animation:fadeUp 0.4s ease forwards;}
        input,select,button{font-family:'Sora',sans-serif;}
        button:active{opacity:0.8;}
      `}</style>

      {/* Header */}
      <div style={{padding:"24px 20px 14px",background:d?"linear-gradient(180deg,#0f172a,#020617)":"linear-gradient(180deg,#fff,#f8fafc)",borderBottom:`1px solid ${border}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontSize:10,color:sub,letterSpacing:2,textTransform:"uppercase"}}>Wednesday, 20 May 2026</p>
            <h1 style={{fontSize:20,fontWeight:800,marginTop:4,background:"linear-gradient(90deg,#6366f1,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              Good afternoon 👋
            </h1>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {syncing && <div style={{width:8,height:8,borderRadius:99,background:"#22c55e",animation:"pulse 1s infinite"}} title="Syncing…"/>}
            <button onClick={loadAll} style={{background:d?"#1e293b":"#f1f5f9",border:`1px solid ${border}`,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:14}} title="Refresh">🔄</button>
            <button onClick={()=>setDark(!d)} style={{background:d?"#1e293b":"#f1f5f9",border:`1px solid ${border}`,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:16}}>{d?"☀️":"🌙"}</button>
          </div>
        </div>
      </div>

      {/* DB Error banner */}
      {dbError && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",margin:"12px 20px",borderRadius:12,padding:"12px 16px"}}>
          <p style={{fontSize:12,color:"#b91c1c",fontWeight:600}}>⚠️ Supabase not connected</p>
          <p style={{fontSize:11,color:"#dc2626",marginTop:4}}>{dbError}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{padding:"20px"}}>
          {[1,2,3,4].map(i=><div key={i} style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
            <Skeleton h={14} w="40%" dark={d}/><Skeleton h={28} dark={d}/><Skeleton h={10} w="60%" dark={d}/>
          </div>)}
        </div>
      )}

      {!loading && (
        <>
        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div style={{padding:"16px 20px"}} className="fade-up">

            {/* Multi-source Income Card */}
            <div style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)",borderRadius:20,padding:"20px 24px",marginBottom:12,boxShadow:"0 8px 32px rgba(99,102,241,0.25)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <p style={{fontSize:11,color:"#bfdbfe",letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Total Net Income</p>
                  <p style={{fontSize:30,fontWeight:800,color:"#fff"}}>RM {fmt(netIncome)}</p>
                  <p style={{fontSize:12,color:"#bfdbfe",marginTop:4}}>May 2026 · {incomeSources.filter(s=>s.amount>0).length} active source{incomeSources.filter(s=>s.amount>0).length!==1?"s":""}</p>
                </div>
                <button onClick={()=>setModal("manageIncome")} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:10,padding:"6px 12px",color:"#fff",fontSize:12,cursor:"pointer"}}>✏️ Edit</button>
              </div>
              {/* Per-source breakdown */}
              <div style={{borderTop:"1px solid rgba(255,255,255,0.15)",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                {incomeSources.map(src=>(
                  <div key={src.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:14}}>{src.icon}</span>
                      <span style={{fontSize:13,color:"#bfdbfe"}}>{src.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>RM {fmt(src.amount)}</span>
                      <div style={{height:4,width:50,background:"rgba(255,255,255,0.15)",borderRadius:99}}>
                        <div style={{height:"100%",width:`${netIncome>0?(src.amount/netIncome)*100:0}%`,background:"rgba(255,255,255,0.6)",borderRadius:99}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div style={{background:card,borderRadius:16,padding:"14px 16px",border:`1px solid ${border}`}}>
                <p style={{fontSize:11,color:sub,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Committed</p>
                <p style={{fontSize:16,fontWeight:700,color:"#f87171"}}>RM {fmt(loans.reduce((s,l)=>s+Number(l.monthly),0))}</p>
                <p style={{fontSize:10,color:sub,marginTop:4}}>Loan repayments/mo</p>
              </div>
              <div style={{background:card,borderRadius:16,padding:"14px 16px",border:`1px solid ${border}`}}>
                <p style={{fontSize:11,color:sub,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Remaining</p>
                <p style={{fontSize:16,fontWeight:700,color:"#22c55e"}}>RM {fmt(netIncome-loans.reduce((s,l)=>s+Number(l.monthly),0))}</p>
                <p style={{fontSize:10,color:sub,marginTop:4}}>After committed</p>
              </div>
            </div>
            <div style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div>
                  <p style={{fontWeight:700,fontSize:16,color:text}}>Financial Health Score</p>
                  <p style={{fontSize:11,color:sub,marginTop:2}}>Updated daily · May 2026</p>
                </div>
                <span style={{fontSize:12,color:"#6366f1",fontWeight:600,cursor:"pointer"}}>Full report →</span>
              </div>
              <div style={{display:"flex",gap:20,alignItems:"center"}}>
                <CircleScore score={65} dark={d}/>
                <div style={{flex:1}}>
                  <ScoreBar label="DSR" score={35} max={40} detail={`Loan burden ${dsrRatio}% — under 30% target`} color="#22c55e" dark={d}/>
                  <ScoreBar label="Savings Rate" score={20} max={30} detail="17.8% of net income saved" color="#3b82f6" dark={d}/>
                  <ScoreBar label="Emergency Fund" score={10} max={30} detail="71% of RM 15k target" color="#f97316" dark={d}/>
                </div>
              </div>
            </div>
            {/* Checklist */}
            <div style={{background:card,borderRadius:20,padding:20,border:`1px solid ${border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <p style={{fontWeight:700,fontSize:16,color:text}}>Payment Checklist</p>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:12,color:sub}}>{paidCount}/{checklist.length} paid</span>
                  <button onClick={()=>setChecklistEditMode(!checklistEditMode)} style={{background:checklistEditMode?"#7c3aed":d?"#1e293b":"#f1f5f9",border:"none",borderRadius:8,padding:"4px 10px",color:checklistEditMode?"#fff":sub,fontSize:12,cursor:"pointer",fontWeight:600,transition:"all 0.2s"}}>
                    {checklistEditMode?"Done":"Edit"}
                  </button>
                </div>
              </div>
              <div style={{height:6,background:d?"#1e293b":"#e2e8f0",borderRadius:99,marginBottom:4}}>
                <div style={{height:"100%",width:`${checklist.length?((paidCount/checklist.length)*100):0}%`,background:"#22c55e",borderRadius:99,transition:"width 0.4s"}}/>
              </div>
              <p style={{fontSize:11,color:sub,marginBottom:14}}>{checklist.length?Math.round((paidCount/checklist.length)*100):0}% complete · May 2026</p>
              {[...checklist].sort((a,b)=>{
                // No due date goes to bottom
                if(!a.due_date && !b.due_date) return 0;
                if(!a.due_date) return 1;
                if(!b.due_date) return -1;
                return new Date(a.due_date) - new Date(b.due_date);
              }).slice(0,showAllChecklist?checklist.length:6).map(item=>{
                const today = new Date(); today.setHours(0,0,0,0);
                const due = item.due_date ? new Date(item.due_date) : null;
                const isOverdue = due && !item.paid && due < today;
                const isDueToday = due && !item.paid && due.toDateString()===today.toDateString();
                const dueFmt = due ? due.toLocaleDateString("en-MY",{day:"numeric",month:"short"}) : null;
                return (
                <div key={item.id} style={{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${border}`,gap:8}}>
                  {checklistEditMode&&<span style={{fontSize:14,color:sub,cursor:"grab",userSelect:"none"}}>☰</span>}
                  <div onClick={()=>!checklistEditMode&&toggleChecklist(item)}
                    style={{width:20,height:20,borderRadius:6,flexShrink:0,border:`2px solid ${item.paid?"#22c55e":isOverdue?"#ef4444":border}`,background:item.paid?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",transition:"all 0.2s",cursor:checklistEditMode?"default":"pointer"}}>
                    {item.paid?"✓":""}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:14,color:item.paid&&!checklistEditMode?sub:text,textDecoration:item.paid&&!checklistEditMode?"line-through":"none",transition:"all 0.2s"}}>{item.name}</span>
                      <span style={{fontSize:13,fontWeight:700,color:item.paid&&!checklistEditMode?"#22c55e":sub,flexShrink:0,marginLeft:8}}>RM {fmt(item.amount)}</span>
                    </div>
                    {dueFmt && !item.paid && (
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                        <span style={{fontSize:10,color:isOverdue?"#ef4444":isDueToday?"#f97316":"#64748b"}}>
                          📅 {isOverdue?"Overdue · ":isDueToday?"Due today · ":""}{dueFmt}
                        </span>
                        {isOverdue && <span style={{background:"#fee2e2",color:"#ef4444",fontSize:9,padding:"1px 6px",borderRadius:99,fontWeight:700}}>OVERDUE</span>}
                        {isDueToday && <span style={{background:"#fff7ed",color:"#ea580c",fontSize:9,padding:"1px 6px",borderRadius:99,fontWeight:700}}>TODAY</span>}
                      </div>
                    )}
                  </div>
                  {checklistEditMode&&(
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button onClick={()=>{setEditingChecklistItem(item);setForm({name:item.name,amount:item.amount,due_date:item.due_date||""});setModal("editChecklistItem");}} style={{background:d?"#1e293b":"#f1f5f9",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13}}>✏️</button>
                      <button onClick={()=>deleteChecklistItem(item.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13}}>🗑</button>
                    </div>
                  )}
                </div>
                );
              })}
              {checklistEditMode&&(
                <button onClick={()=>{setEditingChecklistItem(null);setForm({name:"",amount:""});setModal("editChecklistItem");}} style={{width:"100%",marginTop:12,background:"linear-gradient(135deg,#6366f1,#7c3aed)",border:"none",borderRadius:12,padding:"11px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Add Item</button>
              )}
              {!checklistEditMode&&checklist.length>6&&(
                <button onClick={()=>setShowAllChecklist(!showAllChecklist)} style={{width:"100%",marginTop:12,background:"transparent",border:`1px solid ${border}`,borderRadius:10,padding:8,color:"#6366f1",fontSize:13,cursor:"pointer"}}>
                  {showAllChecklist?"Show less":`+${checklist.length-6} more items`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── EXPENSES ── */}
        {tab==="expenses"&&(
          <div style={{padding:"16px 20px"}} className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:800,color:text}}>Expenses</h2>
              <button onClick={()=>{setForm({name:"",category:"Food",amount:""});setModal("addExpense");}} style={{background:"linear-gradient(135deg,#6366f1,#7c3aed)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button>
            </div>
            <div style={{background:"linear-gradient(135deg,#ea580c,#f97316)",borderRadius:20,padding:"20px 24px",marginBottom:14,boxShadow:"0 8px 32px rgba(249,115,22,0.25)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <p style={{fontSize:11,color:"#fed7aa",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Monthly Budget</p>
                  <p style={{fontSize:11,color:"#fed7aa"}}>25 Apr – 24 May</p>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{background:"rgba(255,255,255,0.2)",borderRadius:99,fontSize:11,padding:"4px 12px",fontWeight:700,color:"#fff"}}>{totalSpent<=monthlyBudget?"ON TRACK":"OVER BUDGET"}</span>
                  <button onClick={()=>{setForm({monthlyBudget});setModal("editBudget");}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"4px 8px",color:"#fff",fontSize:11,cursor:"pointer"}}>✏️</button>
                </div>
              </div>
              <p style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:10}}>RM {fmt(totalSpent)} <span style={{fontSize:13,fontWeight:400}}>of RM {fmt(monthlyBudget)}</span></p>
              <div style={{height:6,background:"rgba(255,255,255,0.2)",borderRadius:99}}>
                <div style={{height:"100%",width:`${Math.min((totalSpent/monthlyBudget)*100,100)}%`,background:"#fff",borderRadius:99,transition:"width 0.6s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                <span style={{fontSize:11,color:"#fed7aa"}}>{Math.round((totalSpent/monthlyBudget)*100)}% used</span>
                <span style={{fontSize:11,color:"#fed7aa"}}>RM {fmt(Math.max(monthlyBudget-totalSpent,0))} remaining</span>
              </div>
            </div>
            <div style={{background:card,borderRadius:20,padding:20,border:`1px solid ${border}`}}>
              <p style={{fontWeight:700,fontSize:16,color:text,marginBottom:14}}>Recent</p>
              {expenses.length===0&&<p style={{fontSize:13,color:sub,textAlign:"center",padding:"20px 0"}}>No expenses yet. Tap + Add to log one.</p>}
              {Object.entries(groupedExpenses).map(([dateLabel,exps])=>(
                <div key={dateLabel}>
                  <p style={{fontSize:10,color:sub,textTransform:"uppercase",letterSpacing:1.5,margin:"12px 0 8px"}}>{dateLabel}</p>
                  {exps.map(exp=>(
                    <div key={exp.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${border}`}}>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        <div style={{width:38,height:38,borderRadius:12,background:d?"#1e293b":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{exp.icon}</div>
                        <div>
                          <p style={{fontWeight:600,fontSize:14,color:text}}>{exp.name}</p>
                          <p style={{fontSize:11,color:sub}}>{exp.category} · {exp.time}</p>
                        </div>
                      </div>
                      <span style={{fontWeight:700,fontSize:14,color:"#f87171"}}>-RM {fmt(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOANS ── */}
        {tab==="loans"&&(
          <div style={{padding:"16px 20px"}} className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:800,color:text}}>Loans</h2>
              <button onClick={openAddLoan} style={{background:"linear-gradient(135deg,#6366f1,#7c3aed)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button>
            </div>
            <div style={{background:"linear-gradient(135deg,#b91c1c,#ef4444)",borderRadius:20,padding:"20px 24px",marginBottom:14,boxShadow:"0 8px 32px rgba(239,68,68,0.2)"}}>
              <p style={{fontSize:11,color:"#fecaca",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Total Outstanding</p>
              <p style={{fontSize:26,fontWeight:800,color:"#fff"}}>RM {fmt(totalLoans)}</p>
              <p style={{fontSize:12,color:"#fecaca",marginTop:4}}>{loans.length} active loans · RM {fmt(loans.reduce((s,l)=>s+Number(l.monthly),0))}/month</p>
            </div>
            {loans.map(loan=>(
              <div key={loan.id} style={{background:card,borderRadius:16,padding:"16px 20px",marginBottom:12,border:`1px solid ${border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:40,height:40,borderRadius:12,background:loan.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{loan.icon}</div>
                    <div>
                      <p style={{fontWeight:700,color:text,fontSize:15}}>{loan.name}</p>
                      <p style={{color:sub,fontSize:12}}>{loan.type}</p>
                    </div>
                  </div>
                  <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                    <p style={{color:loan.color,fontWeight:700,fontSize:14}}>RM {fmt(loan.monthly)}/mo</p>
                    <div style={{display:"flex",gap:6}}>
                      {loan.due&&<span style={{background:"#fef3c7",color:"#92400e",borderRadius:99,fontSize:10,padding:"2px 8px",fontWeight:700}}>DUE</span>}
                      <button onClick={()=>openEditLoan(loan)} style={{background:d?"#1e293b":"#f1f5f9",border:"none",borderRadius:6,padding:"2px 8px",color:sub,fontSize:11,cursor:"pointer"}}>✏️</button>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:sub}}>Paid off</span>
                    <span style={{fontSize:11,color:text,fontWeight:700}}>{loan.paid}%</span>
                  </div>
                  <div style={{height:6,background:d?"#1e293b":"#e2e8f0",borderRadius:99}}>
                    <div style={{height:"100%",width:`${loan.paid}%`,background:loan.color,borderRadius:99,transition:"width 0.6s"}}/>
                  </div>
                  <p style={{fontSize:11,color:sub,marginTop:6}}>Payoff: <strong style={{color:d?"#94a3b8":"#475569"}}>{loan.payoff}</strong> ({loan.months} mo)</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EV CHARGING ── */}
        {tab==="ev"&&(()=>{
          const totalKwh  = evSessions.reduce((s,e)=>s+Number(e.kwh),0);
          const totalCost = evSessions.reduce((s,e)=>s+Number(e.cost||0),0);
          const avgRate   = evSessions.length ? (evSessions.reduce((s,e)=>s+Number(e.rate||0),0)/evSessions.length) : 0;
          const avgKwh    = evSessions.length ? totalKwh/evSessions.length : 0;
          const lastRate  = evSessions.length ? Number(evSessions[0].rate||0) : 0;
          return (
          <div style={{padding:"16px 20px"}} className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h2 style={{fontSize:20,fontWeight:800,color:text}}>EV Charging</h2>
              <button onClick={()=>{setForm({cutoffDay});setModal("evSettings");}} style={{width:36,height:36,borderRadius:10,background:card,border:`1px solid ${border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16}}>⚙️</button>
            </div>

            {/* Summary card */}
            <div style={{background:"linear-gradient(135deg,#3730a3,#7c3aed)",borderRadius:20,padding:"18px 24px",marginBottom:12,boxShadow:"0 8px 32px rgba(124,58,237,0.25)"}}>
              <p style={{fontSize:10,color:"#c4b5fd",letterSpacing:1.5,textTransform:"uppercase",marginBottom:10}}>This Month · May 2026</p>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  <p style={{fontSize:28,fontWeight:800,color:"#fff"}}>RM {fmt(totalCost)}</p>
                  <p style={{fontSize:12,color:"#c4b5fd",marginTop:4}}>{evSessions.length} session{evSessions.length!==1?"s":""} · {totalKwh.toFixed(1)} kWh total</p>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontSize:10,color:"#c4b5fd",marginBottom:4}}>Avg rate</p>
                  <p style={{fontSize:18,fontWeight:700,color:"#fff"}}>RM {avgRate.toFixed(3)}<span style={{fontSize:11,fontWeight:400}}>/kWh</span></p>
                  <p style={{fontSize:10,color:"#c4b5fd",marginTop:2}}>Cut-off Day {cutoffDay}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {label:"Sessions",   value:String(evSessions.length),        color:text},
                {label:"Total kWh",  value:totalKwh.toFixed(1),              color:"#6366f1"},
                {label:"Total Cost", value:`RM ${fmt(totalCost)}`,           color:"#f87171"},
                {label:"Avg kWh",    value:`${avgKwh.toFixed(1)} kWh`,       color:"#a855f7"},
              ].map(s=>(
                <div key={s.label} style={{background:card,borderRadius:16,padding:"14px 16px",border:`1px solid ${border}`,textAlign:"center"}}>
                  <p style={{fontSize:18,fontWeight:800,color:s.color,marginBottom:4}}>{s.value}</p>
                  <p style={{fontSize:10,color:sub,textTransform:"uppercase",letterSpacing:1}}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Sessions list */}
            <div style={{background:card,borderRadius:20,padding:20,border:`1px solid ${border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <p style={{fontWeight:700,fontSize:16,color:text}}>Sessions</p>
                  <p style={{fontSize:11,color:sub,marginTop:2}}>Last used rate: RM {lastRate.toFixed(3)}/kWh</p>
                </div>
                <button onClick={()=>{
                  setEditingSession(null);
                  setForm({date:new Date().toISOString().slice(0,10),kwh:"",rate:lastRate||"",charger:"",duration:"",type:"DC"});
                  setModal("evSession");
                }} style={{background:"linear-gradient(135deg,#6366f1,#7c3aed)",border:"none",borderRadius:12,padding:"7px 14px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</button>
              </div>

              {evSessions.length===0&&<p style={{fontSize:13,color:sub,textAlign:"center",padding:"20px 0"}}>No sessions yet. Tap + Add to log one.</p>}

              {evSessions.map((s,i)=>(
                <div key={s.id} style={{padding:"12px 0",borderBottom:i<evSessions.length-1?`1px solid ${border}`:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:38,height:38,borderRadius:12,background:s.type==="DC"?"#1d4ed833":"#7c3aed33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚡</div>
                      <div>
                        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                          <p style={{fontWeight:600,fontSize:14,color:text}}>{s.date}</p>
                          <span style={{background:s.type==="DC"?"#1d4ed8":"#7c3aed",borderRadius:4,padding:"1px 6px",fontSize:9,color:"#fff"}}>{s.type}</span>
                        </div>
                        {s.charger&&<p style={{fontSize:11,color:"#6366f1",fontWeight:600,marginTop:1}}>📍 {s.charger}</p>}
                        <p style={{fontSize:11,color:sub,marginTop:2}}>
                          {s.kwh} kWh · {s.duration}
                          {s.rate ? ` · RM ${Number(s.rate).toFixed(3)}/kWh` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#a5b4fc"}}>RM {fmt(Number(s.cost||0))}</span>
                      <button onClick={()=>{setEditingSession(s);setForm({...s, date:new Date().toISOString().slice(0,10)});setModal("evSession");}} style={{background:d?"#1e293b":"#f1f5f9",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12}}>✏️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ── ANNUAL ── */}
        {tab==="annual"&&(()=>{
          const completed=ANNUAL_DATA.filter(m=>m.expenses>0);
          const totExp=completed.reduce((s,m)=>s+m.expenses,0);
          const totSav=completed.reduce((s,m)=>s+m.savings,0);
          const totEV =completed.reduce((s,m)=>s+m.ev,0);
          const avgExp=completed.length?totExp/completed.length:0;
          const savRate=netIncome>0?((totSav/(completed.length*netIncome))*100).toFixed(1):0;
          const activeMonths=completed.length;
          const BarChart=({data,valueKey,color,color2,valueKey2,maxOverride})=>{
            const vals=data.map(m=>m[valueKey]);
            const vals2=valueKey2?data.map(m=>m[valueKey2]):[];
            const max=maxOverride||Math.max(...vals,...vals2,1);
            return (
              <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100,paddingTop:8}}>
                {data.map((m,i)=>{
                  const isFuture=m.expenses===0&&i>=activeMonths;
                  const h=Math.round((m[valueKey]/max)*88);
                  const h2=valueKey2?Math.round((m[valueKey2]/max)*88):0;
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",display:"flex",gap:1,alignItems:"flex-end",justifyContent:"center"}}>
                        <div style={{flex:1,borderRadius:"3px 3px 0 0",height:`${h||2}px`,background:isFuture?(d?"#1e293b":"#e2e8f0"):color,minHeight:2,transition:"height 0.6s ease",opacity:isFuture?0.3:1}}/>
                        {valueKey2&&<div style={{flex:1,borderRadius:"3px 3px 0 0",height:`${h2||2}px`,background:isFuture?(d?"#1e293b":"#e2e8f0"):color2,minHeight:2,transition:"height 0.6s ease",opacity:isFuture?0.3:1}}/>}
                      </div>
                      <span style={{fontSize:8,color:isFuture?(d?"#334155":"#cbd5e1"):sub,fontWeight:i===activeMonths-1?700:400}}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            );
          };
          return (
          <div style={{padding:"16px 20px"}} className="fade-up">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <h2 style={{fontSize:20,fontWeight:800,color:text}}>Annual Summary</h2>
              <span style={{fontSize:12,color:sub,background:d?"#1e293b":"#f1f5f9",borderRadius:99,padding:"4px 10px"}}>2026</span>
            </div>
            <p style={{fontSize:12,color:sub,marginBottom:16}}>Jan – May · {activeMonths} months tracked</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{label:"Total Spent",value:`RM ${(totExp/1000).toFixed(1)}k`,color:"#f87171",icon:"💸"},{label:"Total Saved",value:`RM ${(totSav/1000).toFixed(1)}k`,color:"#22c55e",icon:"🏦"},{label:"Savings Rate",value:`${savRate}%`,color:"#3b82f6",icon:"📈"}].map(k=>(
                <div key={k.label} style={{background:card,borderRadius:16,padding:"12px 10px",border:`1px solid ${border}`,textAlign:"center"}}>
                  <p style={{fontSize:16}}>{k.icon}</p>
                  <p style={{fontSize:15,fontWeight:800,color:k.color,margin:"4px 0 2px"}}>{k.value}</p>
                  <p style={{fontSize:9,color:sub,textTransform:"uppercase",letterSpacing:0.5}}>{k.label}</p>
                </div>
              ))}
            </div>
            <div style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div><p style={{fontWeight:700,fontSize:15,color:text}}>Expenses vs Savings</p><p style={{fontSize:11,color:sub,marginTop:2}}>Monthly · 2026</p></div>
                <div style={{display:"flex",gap:10}}>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:2,background:"#f87171"}}/><span style={{fontSize:10,color:sub}}>Exp</span></div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}><div style={{width:8,height:8,borderRadius:2,background:"#22c55e"}}/><span style={{fontSize:10,color:sub}}>Sav</span></div>
                </div>
              </div>
              <BarChart data={ANNUAL_DATA} valueKey="expenses" color="#f87171" valueKey2="savings" color2="#22c55e" maxOverride={3000}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:12,padding:"10px 0",borderTop:`1px solid ${border}`}}>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>Avg/month</p><p style={{fontSize:14,fontWeight:700,color:"#f87171"}}>RM {fmt(avgExp)}</p></div>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>YTD total</p><p style={{fontSize:14,fontWeight:700,color:"#f87171"}}>RM {fmt(totExp)}</p></div>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>YTD saved</p><p style={{fontSize:14,fontWeight:700,color:"#22c55e"}}>RM {fmt(totSav)}</p></div>
              </div>
            </div>
            <div style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
              <p style={{fontWeight:700,fontSize:15,color:text,marginBottom:2}}>Loan Repayment</p>
              <p style={{fontSize:11,color:sub,marginBottom:14}}>YTD paid · {activeMonths} months</p>
              {loans.map(loan=>(
                <div key={loan.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:14}}>{loan.icon}</span><span style={{fontSize:13,fontWeight:600,color:text}}>{loan.name}</span></div>
                    <span style={{fontSize:12,fontWeight:700,color:loan.color}}>RM {fmt(Number(loan.monthly)*activeMonths)}</span>
                  </div>
                  <div style={{height:6,background:d?"#1e293b":"#e2e8f0",borderRadius:99}}>
                    <div style={{height:"100%",width:`${Math.min(Number(loan.paid),100)}%`,background:loan.color,borderRadius:99,transition:"width 0.8s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                    <span style={{fontSize:10,color:sub}}>{loan.paid}% paid overall</span>
                    <span style={{fontSize:10,color:sub}}>Payoff {loan.payoff}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div><p style={{fontWeight:700,fontSize:15,color:text}}>EV Charging Cost</p><p style={{fontSize:11,color:sub,marginTop:2}}>Monthly TNB · 2026</p></div>
                <span style={{fontSize:12,fontWeight:700,color:"#a5b4fc"}}>RM {fmt(totEV)} YTD</span>
              </div>
              <BarChart data={ANNUAL_DATA} valueKey="ev" color="#7c3aed" maxOverride={140}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:12,padding:"10px 0",borderTop:`1px solid ${border}`}}>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>Avg/month</p><p style={{fontSize:14,fontWeight:700,color:"#a5b4fc"}}>RM {fmt(totEV/Math.max(activeMonths,1))}</p></div>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>Avg rate</p><p style={{fontSize:14,fontWeight:700,color:"#a5b4fc"}}>{evSessions.length?(evSessions.reduce((s,e)=>s+Number(e.rate||0),0)/evSessions.length).toFixed(3):"—"}/kWh</p></div>
                <div style={{textAlign:"center"}}><p style={{fontSize:11,color:sub}}>Proj. full yr</p><p style={{fontSize:14,fontWeight:700,color:"#a5b4fc"}}>RM {fmt((totEV/Math.max(activeMonths,1))*12)}</p></div>
              </div>
            </div>
            <div style={{background:card,borderRadius:20,padding:20,marginBottom:12,border:`1px solid ${border}`}}>
              <p style={{fontWeight:700,fontSize:15,color:text,marginBottom:2}}>Spending by Category</p>
              <p style={{fontSize:11,color:sub,marginBottom:16}}>YTD breakdown · 2026</p>
              <div style={{display:"flex",height:14,borderRadius:99,overflow:"hidden",marginBottom:16}}>
                {CATEGORY_ANNUAL.map(c=><div key={c.name} style={{width:`${c.pct}%`,background:c.color}}/>)}
              </div>
              {CATEGORY_ANNUAL.map(c=>(
                <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${border}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>
                    <span style={{fontSize:13,color:text}}>{c.name}</span>
                  </div>
                  <div style={{display:"flex",gap:12,alignItems:"center"}}>
                    <div style={{width:80,height:5,background:d?"#1e293b":"#e2e8f0",borderRadius:99}}>
                      <div style={{height:"100%",width:`${c.pct}%`,background:c.color,borderRadius:99}}/>
                    </div>
                    <span style={{fontSize:12,color:sub,width:30,textAlign:"right"}}>{c.pct}%</span>
                    <span style={{fontSize:13,fontWeight:700,color:text,width:64,textAlign:"right"}}>RM {fmt(c.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)",borderRadius:20,padding:20,marginBottom:4}}>
              <p style={{fontWeight:700,fontSize:15,color:"#fff",marginBottom:12}}>Income Allocation · May 2026</p>
              {[{label:"Loan Repayments",amt:loans.reduce((s,l)=>s+Number(l.monthly),0),color:"#fca5a5"},{label:"Monthly Expenses",amt:Math.round(avgExp),color:"#fde68a"},{label:"Savings",amt:Math.round(totSav/Math.max(activeMonths,1)),color:"#86efac"}].map(row=>{
                const pct=Math.round((row.amt/netIncome)*100);
                return (
                  <div key={row.label} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,color:"#bfdbfe"}}>{row.label}</span>
                      <span style={{fontSize:12,color:"#fff",fontWeight:700}}>RM {fmt(row.amt)} <span style={{fontWeight:400,opacity:0.7}}>({pct}%)</span></span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.15)",borderRadius:99}}>
                      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:row.color,borderRadius:99,transition:"width 0.8s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}
        </>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:navBg,borderTop:`1px solid ${border}`,display:"flex",padding:"10px 0 20px",zIndex:100,transition:"background 0.3s"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"transparent",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:10,color:tab===t.id?"#7c3aed":sub,fontWeight:tab===t.id?700:400,letterSpacing:0.3}}>{t.label}</span>
            {tab===t.id&&<div style={{width:4,height:4,borderRadius:99,background:"#7c3aed",marginTop:-2}}/>}
          </button>
        ))}
      </div>

      {/* ── MODALS ── */}

      {/* Manage Income Sources */}
      <Modal open={modal==="manageIncome"} onClose={()=>setModal(null)} title="Income Sources" dark={d}>
        <p style={{fontSize:12,color:sub,marginBottom:14}}>Tap a source to edit · Total: <strong style={{color:text}}>RM {fmt(netIncome)}</strong></p>
        {incomeSources.map(src=>(
          <div key={src.id} onClick={()=>{setEditingIncomeSource(src);setForm({...src});setModal("editIncomeSource");}}
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:d?"#1e293b":"#f8fafc",borderRadius:14,marginBottom:10,cursor:"pointer",border:`1px solid ${border}`}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:10,background:src.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{src.icon}</div>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:text}}>{src.name}</p>
                <p style={{fontSize:11,color:sub}}>{Number(src.amount)>0?`RM ${fmt(src.amount)}/month`:"Not set"}</p>
              </div>
            </div>
            <span style={{fontSize:16,color:sub}}>›</span>
          </div>
        ))}
        <button onClick={()=>{setEditingIncomeSource(null);setForm({name:"",amount:"",icon:"💵",color:"#6366f1",sort_order:incomeSources.length+1});setModal("editIncomeSource");}}
          style={{width:"100%",background:"linear-gradient(135deg,#6366f1,#7c3aed)",border:"none",borderRadius:14,padding:"13px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4,fontFamily:"Sora,sans-serif"}}>
          + Add Income Source
        </button>
      </Modal>

      {/* Add / Edit single Income Source */}
      <Modal open={modal==="editIncomeSource"} onClose={()=>setModal(null)} title={editingIncomeSource?"Edit Source":"Add Source"} dark={d}>
        <Input label="Source Name" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Locum, Freelance, Rental…" dark={d}/>
        <Input label="Monthly Amount" value={form.amount||""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} type="number" step="0.01" prefix="RM" dark={d}/>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:8,fontWeight:600}}>Icon</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["💼","🏥","💊","🏠","🚗","💻","📦","💵","🎓","🛒"].map(ic=>(
              <button key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))} style={{width:40,height:40,borderRadius:10,border:`2px solid ${form.icon===ic?"#7c3aed":border}`,background:form.icon===ic?"#7c3aed22":"transparent",fontSize:18,cursor:"pointer"}}>{ic}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:8,fontWeight:600}}>Colour</label>
          <div style={{display:"flex",gap:8}}>
            {["#6366f1","#22c55e","#f97316","#3b82f6","#ec4899","#eab308","#8b5cf6"].map(c=>(
              <div key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:99,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",transition:"border 0.2s"}}/>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn onClick={()=>setModal("manageIncome")} variant="secondary" dark={d}>Back</Btn>
          <Btn onClick={saveIncomeSource} dark={d}>Save</Btn>
        </div>
        {editingIncomeSource&&(
          <button onClick={()=>deleteIncomeSource(editingIncomeSource.id)}
            style={{width:"100%",marginTop:10,background:"transparent",border:"1px solid #ef4444",borderRadius:14,padding:12,color:"#ef4444",fontSize:14,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>
            🗑 Remove Source
          </button>
        )}
      </Modal>
      <Modal open={modal==="editBudget"} onClose={()=>setModal(null)} title="Edit Monthly Budget" dark={d}>
        <Input label="Monthly Budget" value={form.monthlyBudget||""} onChange={e=>setForm(p=>({...p,monthlyBudget:e.target.value}))} type="number" prefix="RM" dark={d}/>
        <Btn onClick={saveBudget} dark={d}>Save Changes</Btn>
      </Modal>
      <Modal open={modal==="addExpense"} onClose={()=>setModal(null)} title="Add Expense" dark={d}>
        <Input label="Description" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} dark={d}/>
        <Input label="Amount" value={form.amount||""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} type="number" step="0.01" prefix="RM" dark={d}/>
        <Select label="Category" value={form.category||"Food"} onChange={e=>setForm(p=>({...p,category:e.target.value}))} options={Object.keys(CATEGORY_ICONS)} dark={d}/>
        <Btn onClick={saveExpense} dark={d}>Add Expense</Btn>
      </Modal>
      <Modal open={modal==="editLoan"||modal==="addLoan"} onClose={()=>setModal(null)} title={modal==="editLoan"?"Edit Loan":"Add Loan"} dark={d}>
        <Input label="Loan Name" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} dark={d}/>
        <Select label="Type" value={form.type||"Personal"} onChange={e=>setForm(p=>({...p,type:e.target.value}))} options={["Car Loan","Medical","Personal","Education","Housing","Other"]} dark={d}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Monthly (RM)" value={form.monthly||""} onChange={e=>setForm(p=>({...p,monthly:e.target.value}))} type="number" dark={d}/>
          <Input label="Total Outstanding (RM)" value={form.total||""} onChange={e=>setForm(p=>({...p,total:e.target.value}))} type="number" dark={d}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="% Paid Off" value={form.paid||""} onChange={e=>setForm(p=>({...p,paid:e.target.value}))} type="number" dark={d}/>
          <Input label="Months Remaining" value={form.months||""} onChange={e=>setForm(p=>({...p,months:e.target.value}))} type="number" dark={d}/>
        </div>
        <Input label="Payoff Date (e.g. Dec 2034)" value={form.payoff||""} onChange={e=>setForm(p=>({...p,payoff:e.target.value}))} dark={d}/>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:6,fontWeight:600}}>Colour</label>
          <div style={{display:"flex",gap:8}}>
            {["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899"].map(c=>(
              <div key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{width:28,height:28,borderRadius:99,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",transition:"border 0.2s"}}/>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
          <input type="checkbox" id="due" checked={!!form.due} onChange={e=>setForm(p=>({...p,due:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
          <label htmlFor="due" style={{fontSize:14,color:d?"#e2e8f0":"#1e293b",cursor:"pointer"}}>Mark as Due this month</label>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn onClick={()=>setModal(null)} variant="secondary" dark={d}>Cancel</Btn>
          <Btn onClick={saveLoan} dark={d}>Save Loan</Btn>
        </div>
        {modal==="editLoan"&&<button onClick={()=>deleteLoan(editingLoan.id)} style={{width:"100%",marginTop:10,background:"transparent",border:"1px solid #ef4444",borderRadius:14,padding:12,color:"#ef4444",fontSize:14,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>🗑 Delete Loan</button>}
      </Modal>
      <Modal open={modal==="evSettings"} onClose={()=>setModal(null)} title="EV Settings" dark={d}>
        <Input label="Billing Cut-off Day" value={form.cutoffDay||""} onChange={e=>setForm(p=>({...p,cutoffDay:e.target.value}))} type="number" dark={d}/>
        <p style={{fontSize:11,color:sub,marginBottom:14,marginTop:-8}}>Day of the month your billing cycle resets (1–28)</p>
        <Btn onClick={saveEvSettings} dark={d}>Save Settings</Btn>
      </Modal>
      <Modal open={modal==="evSession"} onClose={()=>setModal(null)} title={editingSession?"Edit Session":"Log Session"} dark={d}>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:6,fontWeight:600}}>Date</label>
          <input type="date" value={form.date||new Date().toISOString().slice(0,10)}
            onChange={e=>setForm(p=>({...p,date:e.target.value}))}
            style={{width:"100%",background:d?"#1e293b":"#f8fafc",border:`1px solid ${d?"#334155":"#e2e8f0"}`,borderRadius:12,padding:"12px",fontSize:15,color:d?"#f1f5f9":"#0f172a",fontFamily:"Sora,sans-serif",outline:"none",cursor:"pointer",colorScheme:d?"dark":"light"}}/>
        </div>
        <Input label="Charger Name / Location" value={form.charger||""} onChange={e=>setForm(p=>({...p,charger:e.target.value}))} placeholder="e.g. ChargEV KLCC, TNB DCFC Bangsar…" dark={d}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Input label="Energy (kWh)" value={form.kwh||""} onChange={e=>setForm(p=>({...p,kwh:e.target.value}))} type="number" step="0.1" dark={d}/>
          <Input label="Rate (RM/kWh)" value={form.rate||""} onChange={e=>setForm(p=>({...p,rate:e.target.value}))} type="number" step="0.001" prefix="RM" dark={d}/>
        </div>
        <Input label="Duration (e.g. 1h 20m)" value={form.duration||""} onChange={e=>setForm(p=>({...p,duration:e.target.value}))} dark={d}/>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:8,fontWeight:600}}>Charger Type</label>
          <div style={{display:"flex",gap:10}}>
            {["AC","DC"].map(t=>(
              <button key={t} onClick={()=>setForm(p=>({...p,type:t}))} style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${form.type===t?"#7c3aed":border}`,background:form.type===t?"#7c3aed22":"transparent",color:form.type===t?"#7c3aed":sub,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Sora,sans-serif",transition:"all 0.2s"}}>{t} {t==="DC"?"⚡":"🔌"}</button>
            ))}
          </div>
        </div>
        {/* Live cost estimate */}
        {(form.kwh||form.rate)&&(
          <div style={{background:d?"#1e293b":"#f8fafc",borderRadius:12,padding:"12px 16px",marginBottom:14,border:`1px solid ${border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,color:sub}}>Estimated cost</span>
              <span style={{fontSize:15,fontWeight:800,color:"#a5b4fc"}}>RM {fmt((+form.kwh||0)*(+form.rate||0))}</span>
            </div>
            <p style={{fontSize:10,color:sub}}>{form.kwh||0} kWh × RM {Number(form.rate||0).toFixed(3)}/kWh</p>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn onClick={()=>setModal(null)} variant="secondary" dark={d}>Cancel</Btn>
          <Btn onClick={saveEvSession} dark={d}>Save Session</Btn>
        </div>
        {editingSession&&<button onClick={()=>deleteEvSession(editingSession.id)} style={{width:"100%",marginTop:10,background:"transparent",border:"1px solid #ef4444",borderRadius:14,padding:12,color:"#ef4444",fontSize:14,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>🗑 Delete Session</button>}
      </Modal>
      <Modal open={modal==="editChecklistItem"} onClose={()=>setModal(null)} title={editingChecklistItem?"Edit Item":"Add Item"} dark={d}>
        <Input label="Item Name" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Netflix, Insurance…" dark={d}/>
        <Input label="Amount (RM)" value={form.amount??""} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} type="number" step="0.01" prefix="RM" dark={d}/>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:d?"#94a3b8":"#64748b",display:"block",marginBottom:6,fontWeight:600}}>Due Date <span style={{fontWeight:400,color:sub}}>(optional)</span></label>
          <input type="date" value={form.due_date||""}
            onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}
            style={{width:"100%",background:d?"#1e293b":"#f8fafc",border:`1px solid ${d?"#334155":"#e2e8f0"}`,borderRadius:12,padding:"12px",fontSize:15,color:form.due_date?(d?"#f1f5f9":"#0f172a"):sub,fontFamily:"Sora,sans-serif",outline:"none",cursor:"pointer",colorScheme:d?"dark":"light"}}/>
          {form.due_date && (
            <button onClick={()=>setForm(p=>({...p,due_date:""}))} style={{background:"transparent",border:"none",color:sub,fontSize:11,cursor:"pointer",marginTop:4,padding:0}}>✕ Clear date</button>
          )}
        </div>
        {form.name?.trim() && form.amount!=="" && (
          <div style={{background:d?"#1e293b":"#f0fdf4",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:sub}}>Will be added as</span>
            <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>{form.name} · RM {fmt(+form.amount||0)}</span>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Btn onClick={()=>setModal(null)} variant="secondary" dark={d}>Cancel</Btn>
          <Btn onClick={saveChecklistItem} dark={d} style={{opacity:form.name?.trim()?1:0.5}}>
            {editingChecklistItem?"Update":"Add Item"}
          </Btn>
        </div>
        {editingChecklistItem&&<button onClick={()=>deleteChecklistItem(editingChecklistItem.id)} style={{width:"100%",marginTop:10,background:"transparent",border:"1px solid #ef4444",borderRadius:14,padding:12,color:"#ef4444",fontSize:14,cursor:"pointer",fontFamily:"Sora,sans-serif"}}>🗑 Remove Item</button>}
      </Modal>
    </div>
  );
}
