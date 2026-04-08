import { h, render, useState, useEffect, useRef, useCallback } from "https://esm.sh/preact@10.19.2/compat";const BAT = 16, RANGE = 133;
const gBC = p => p >= 60 ? "#22c55e" : p >= 30 ? "#f59e0b" : "#ef4444";
const tod = () => new Date().toLocaleDateString("es-ES");

const API = "https://script.google.com/macros/s/AKfycbxmY4q36pwRZyZM-cEAEWNTChhKcXVlLB61avSQTkrtp42MHuX7fim20SpF8FSPR4ir/exec";

const MODES = [
  { id: "eco",    label: "🌿 ECO",    color: "#22c55e" },
  { id: "normal", label: "🚗 Normal", color: "#3b82f6" },
  { id: "sport",  label: "🔥 Rápido", color: "#ef4444" },
];
const CLOCS = [
  { id: "none",   label: "Sin carga",  color: "#475569" },
  { id: "home",   label: "🏠 Casa",    color: "#3b82f6" },
  { id: "work",   label: "🏢 Trabajo", color: "#a78bfa" },
  { id: "public", label: "⚡ Público", color: "#f59e0b" },
];
const SEASONS = [
  { id: "invierno",  label: "❄️ Invierno",  color: "#60a5fa", months: [12,1,2],  rangeEst: "75-95 km",   tip: "Frio reduce bateria ~20-30%. Precalienta enchufado." },
  { id: "primavera", label: "🌸 Primavera", color: "#34d399", months: [3,4,5],   rangeEst: "100-115 km", tip: "Temperatura ideal. Mejor rendimiento del anio." },
  { id: "verano",    label: "☀️ Verano",    color: "#fbbf24", months: [6,7,8],   rangeEst: "105-120 km", tip: "Calor extremo puede degradar bateria. Evita carga al sol." },
  { id: "otono",     label: "🍂 Otonio",    color: "#f97316", months: [9,10,11], rangeEst: "95-110 km",  tip: "Temperaturas en descenso reducen autonomia." },
];
const SCOL = { ok: "#22c55e", warning: "#ef4444", unknown: "#94a3b8" };
const SLAB = { ok: "Activo", warning: "Problemas", unknown: "Sin datos" };

const getSeasonByMonth = () => {
  const m = new Date().getMonth() + 1;
  return SEASONS.find(s => s.months.includes(m))?.id || "primavera";
};

const STATIONS = [
  { name:"PowerGo", addr:"C/ Arnau de Vilanova 7, Sueca", zone:"Sueca", network:"PowerGo", rating:2.5, hours:"24h", status:"warning", notes:"Conector CCS en mal estado.", conn:"CCS, CHAdeMO", lat:39.2062724, lng:-0.3053043 },
  { name:"Cargador Municipal", addr:"Ronda Bernat Alino 57, Sueca", zone:"Sueca", network:"Ayuntamiento", rating:3.0, hours:"24h", status:"ok", notes:"Funciona bien.", conn:"CCS, Type 2", lat:39.2037416, lng:-0.3076841 },
  { name:"Fenide Energia", addr:"Placa Ajuntament 10, Sueca", zone:"Sueca", network:"Fenide", rating:2.3, hours:"24h", status:"warning", notes:"Averias frecuentes.", conn:"Type 2", lat:39.2026217, lng:-0.3104931 },
  { name:"Iberdrola", addr:"Av. Gandient 3, Sueca", zone:"Sueca", network:"Iberdrola", rating:null, hours:"24h", status:"unknown", notes:"Sin valoraciones.", conn:"Type 2, CCS", lat:39.2044050, lng:-0.316332 },
  { name:"Iberdrola bp pulse", addr:"Ctra. Barcelona 44, Puzol", zone:"Puzol", network:"Iberdrola", rating:3.7, hours:"Horario BK/Mercadona", status:"ok", notes:"Junto a Burger King y Mercadona.", conn:"CCS, CHAdeMO, Type 2", lat:39.623219, lng:-0.304116 },
  { name:"Umbrella Charging", addr:"Carrer Tarongers, Puzol", zone:"Puzol", network:"Umbrella", rating:5.0, hours:"24h", status:"ok", notes:"Mejor valorado de Puzol.", conn:"CCS, Type 2", lat:39.6245924, lng:-0.3040361 },
  { name:"EDP ES", addr:"Av. Les Moreres, Sagunto", zone:"Sagunto", network:"EDP", rating:3.9, hours:"24h", status:"ok", notes:"Mejor valorado de Sagunto.", conn:"CCS, Type 2, CHAdeMO", lat:39.674179, lng:-0.263575 },
  { name:"Iberdrola bp pulse Sagunto", addr:"C/ Periodista Azzati s/n, Port de Sagunt", zone:"Sagunto", network:"Iberdrola", rating:2.8, hours:"24h", status:"warning", notes:"Periodos fuera de servicio.", conn:"Ultra CCS, CHAdeMO", lat:39.668097, lng:-0.225118 },
  { name:"Iberdrola IGSA Valencia", addr:"C/ Prof. Beltran Baguena 4, Valencia", zone:"Valencia", network:"Iberdrola", rating:4.3, hours:"24h", status:"ok", notes:"94 kW. Parking IGSA.", conn:"Ultra CCS, CHAdeMO", lat:39.4804177, lng:-0.3889125 },
  { name:"Wenea Campanar", addr:"Av. Pius XII 2, Valencia", zone:"Valencia", network:"Wenea", rating:null, hours:"24h", status:"ok", notes:"Punto 24h.", conn:"CCS, Type 2", lat:39.4811696, lng:-0.3920164 },
  { name:"Wenea Ciutat Vella", addr:"Pl. Sant Agusti s/n, Valencia", zone:"Valencia", network:"Wenea", rating:null, hours:"24h", status:"ok", notes:"Centro historico.", conn:"CCS, Type 2", lat:39.4686457, lng:-0.3798529 },
  { name:"Iberdrola Roger de Lloria", addr:"C/ Roger de Lloria 10, Valencia", zone:"Valencia", network:"Iberdrola", rating:3.0, hours:"24h", status:"ok", notes:"Precio varia segun metodo de pago.", conn:"CCS, Type 2", lat:39.4692034, lng:-0.3746765 },
];

const iS = { background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", color:"#f1f5f9", padding:"8px 12px", width:"100%", fontSize:"14px", boxSizing:"border-box" };
const bP = { background:"#3b82f6", color:"#fff", border:"none", borderRadius:"8px", padding:"10px 16px", cursor:"pointer", fontWeight:"600", fontSize:"14px", width:"100%" };

const Card = ({ children, style = {} }) => h("div", { style: { background:"#1e293b", borderRadius:"16px", padding:"18px", marginBottom:"14px", ...style } }, children);
const Lbl  = ({ children }) => h("label", { style: { fontSize:"12px", color:"#94a3b8", display:"block", marginBottom:"4px" } }, children);
const Row  = ({ label, value, color="#f1f5f9" }) => h("div", { style:{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #334155", fontSize:"13px" } },
  h("span", { style:{ color:"#94a3b8", flexShrink:0, marginRight:"8px" } }, label),
  h("span", { style:{ fontWeight:"600", color, textAlign:"right" } }, value)
);

async function apiGet() {
  const r = await fetch(`${API}?action=getAll`);
  return r.json();
}
async function apiPost(action, data) {
  const r = await fetch(API, { method:"POST", body:JSON.stringify({ action, data }) });
  return r.json();
}

function App() {
  const [registros,     setRegistros]     = useState([]);
  const [sohList,       setSohList]       = useState([]);
  const [currentCharge, setCurrentCharge] = useState(85);
  const [tab,           setTab]           = useState("home");
  const [loadState,     setLoadState]     = useState("loading");
  const [syncing,       setSyncing]       = useState(false);
  const [toast,         setToast]         = useState(null);
  const [dayF,  setDayF]  = useState({ date:tod(), startPct:"", endPct:"", km:"", mode:"eco", chargeLocation:"none", season:getSeasonByMonth() });
  const [editId,setEditId]= useState(null);
  const [degF,  setDegF]  = useState({ realRange:"", date:tod(), notes:"" });
  const [zoneF, setZoneF] = useState("Sueca");
  const [selSt, setSelSt] = useState(null);
  const [aiMsgs,setAiMsgs]= useState([{ role:"assistant", content:"Hola Paola! Soy tu asistente para el VW e-up! 2014. Tus datos se guardan en Google Sheets automaticamente." }]);
  const [aiIn,  setAiIn]  = useState("");
  const [aiLoad,setAiLoad]= useState(false);
  const chatRef = useRef(null);

  useEffect(() => { if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [aiMsgs]);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const loadData = useCallback(async () => {
    setLoadState("loading");
    try {
      const d = await apiGet();
      if (!d.ok) throw new Error(d.error);
      setRegistros((d.registros||[]).sort((a,b)=>b.id-a.id));
      setSohList((d.soh||[]).sort((a,b)=>b.id-a.id));
      if (d.config?.bateria_actual) setCurrentCharge(+d.config.bateria_actual);
      setLoadState("ok");
    } catch(e) { setLoadState("error"); }
  }, []);

  useEffect(()=>{ loadData(); },[]);

  const saveBateria = async val => {
    setCurrentCharge(val);
    try { await apiPost("saveConfig", { clave:"bateria_actual", valor:String(val) }); } catch {}
  };

  const saveDay = async () => {
    const { date, startPct, endPct, km, mode, chargeLocation, season } = dayF;
    if (!startPct||!endPct||!km) { showToast("Rellena todos los campos",false); return; }
    setSyncing(true);
    const consumo = ((((+startPct-+endPct)/100)*BAT)/+km*100).toFixed(1);
    const payload = { fecha:date, bateria_salida:+startPct, bateria_llegada:+endPct, km:+km, consumo:+consumo, modo:mode, carga:chargeLocation, temporada:season };
    try {
      if (editId) {
        await apiPost("updateRegistro", { id:editId, ...payload });
        setRegistros(r=>r.map(x=>x.id===editId?{...x,...payload,id:editId}:x));
        setEditId(null);
        showToast("Registro actualizado");
      } else {
        const res = await apiPost("saveRegistro", payload);
        if (!res.ok) throw new Error(res.error);
        setRegistros(r=>[{id:res.id,...payload},...r]);
        showToast("Guardado en Google Sheets");
      }
      await saveBateria(+endPct);
      setDayF({ date:tod(), startPct:"", endPct:"", km:"", mode:"eco", chargeLocation:"none", season:getSeasonByMonth() });
    } catch(e) { showToast("Error al guardar",false); }
    setSyncing(false);
  };

  const delReg = async id => {
    setSyncing(true);
    try { await apiPost("deleteRegistro",{id}); setRegistros(r=>r.filter(x=>x.id!==id)); showToast("Eliminado"); }
    catch { showToast("Error al eliminar",false); }
    setSyncing(false);
  };

  const editReg = log => {
    setDayF({ date:log.fecha, startPct:String(log.bateria_salida), endPct:String(log.bateria_llegada), km:String(log.km), mode:log.modo, chargeLocation:log.carga, season:log.temporada||getSeasonByMonth() });
    setEditId(log.id); setTab("diary"); window.scrollTo(0,0);
  };

  const saveDeg = async () => {
    if (!degF.realRange) { showToast("Introduce la autonomia real",false); return; }
    setSyncing(true);
    const soh = ((+degF.realRange/RANGE)*100).toFixed(1);
    const kwh = ((+degF.realRange/RANGE)*BAT).toFixed(2);
    try {
      const res = await apiPost("saveSOH",{ fecha:degF.date, autonomia_real:+degF.realRange, soh:+soh, kwh_usables:+kwh, notas:degF.notes });
      if (!res.ok) throw new Error();
      setSohList(s=>[{id:res.id,fecha:degF.date,autonomia_real:+degF.realRange,soh:+soh,kwh_usables:+kwh,notas:degF.notes},...s]);
      setDegF({ realRange:"", date:tod(), notes:"" });
      showToast("SOH guardado");
    } catch { showToast("Error al guardar SOH",false); }
    setSyncing(false);
  };

  const sendAI = async () => {
    if (!aiIn.trim()||aiLoad) return;
    const msg = aiIn.trim(); setAiIn("");
    const msgs = [...aiMsgs,{role:"user",content:msg}];
    setAiMsgs(msgs); setAiLoad(true);
    const ac = registros.length?(registros.reduce((s,l)=>s+(+l.consumo),0)/registros.length).toFixed(1):"15.5";
    const ld = sohList[0];
    const sys = `Eres experto en VE y asistente del VW e-up! 2014 de Paola. DATOS: Bateria 16kWh | Autonomia oficial 133km | SOH:${ld?ld.soh+"%":"no medido"} | Consumo medio:${ac}kWh/100km | Carga actual:${currentCharge}% | Registros:${registros.length} | Km totales:${registros.reduce((s,l)=>s+(+l.km),0)}km | Uso habitual 120km/dia L-V | Zona Sueca-Valencia. Responde en espanol, conciso, max 3 parrafos.`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:sys, messages:msgs.map(m=>({role:m.role,content:m.content})) }) });
      const d = await r.json();
      setAiMsgs([...msgs,{role:"assistant",content:d.content?.map(c=>c.text||"").join("")||"Error."}]);
    } catch { setAiMsgs([...msgs,{role:"assistant",content:"No se pudo conectar."}]); }
    setAiLoad(false);
  };

  const bC  = gBC(currentCharge);
  const eR  = Math.round((currentCharge/100)*112);
  const aK  = ((currentCharge/100)*BAT).toFixed(1);
  const aC  = registros.length?(registros.reduce((s,l)=>s+(+l.consumo),0)/registros.length).toFixed(1):"--";
  const ld  = sohList[0];
  const soh = ld?ld.soh:null;
  const sC  = soh>=85?"#22c55e":soh>=70?"#f59e0b":"#ef4444";
  const pC  = dayF.startPct&&dayF.endPct&&dayF.km?((((+dayF.startPct-+dayF.endPct)/100)*BAT)/+dayF.km*100).toFixed(1):null;
  const filtSt = STATIONS.filter(s=>zoneF==="all"?true:zoneF==="Iberdrola"?s.network==="Iberdrola":zoneF==="ok"?s.status==="ok":s.zone===zoneF);
  const TABS = [["home","🏠"],["diary","Diario"],["seasons","Temp"],["battery","Bateria"],["map","Cargadores"],["advisor","IA"],["stats","Stats"]];

  if (loadState==="loading") return h("div",{style:{background:"#0f172a",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#f1f5f9"}},
    h("div",{style:{fontSize:"48px",marginBottom:"16px"}},"⚡"),
    h("div",{style:{fontWeight:"700",fontSize:"18px",marginBottom:"8px"}},"Cargando tus datos..."),
    h("div",{style:{color:"#94a3b8",fontSize:"13px"}},"Conectando con Google Sheets")
  );

  if (loadState==="error") return h("div",{style:{background:"#0f172a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}},
    h(Card,null,
      h("div",{style:{textAlign:"center"}},
        h("div",{style:{fontSize:"40px",marginBottom:"12px"}},"📡"),
        h("div",{style:{fontWeight:"700",fontSize:"16px",marginBottom:"8px",color:"#fca5a5"}},"Sin conexion con Sheets"),
        h("div",{style:{color:"#94a3b8",fontSize:"13px",marginBottom:"20px"}},"No se pudo conectar con Google Sheets."),
        h("button",{style:bP,onClick:loadData},"Reintentar")
      )
    )
  );

  return h("div",{style:{background:"#0f172a",minHeight:"100vh",color:"#f1f5f9",fontFamily:"system-ui,sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:"70px"}},

    toast && h("div",{style:{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:9999,background:toast.ok?"#14532d":"#7f1d1d",border:`1px solid ${toast.ok?"#22c55e":"#ef4444"}`,color:"#fff",borderRadius:"10px",padding:"10px 20px",fontSize:"13px",fontWeight:"600",whiteSpace:"nowrap"}},toast.msg),

    h("div",{style:{padding:"16px 16px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}},
      h("div",{style:{display:"flex",alignItems:"center",gap:"10px"}},
        h("span",{style:{fontSize:"26px"}},"⚡"),
        h("div",null,
          h("div",{style:{fontWeight:"700",fontSize:"16px"}},"VW e-up! 2014"),
          h("div",{style:{color:"#94a3b8",fontSize:"11px"}},registros.length+" registros · "+registros.reduce((s,l)=>s+(+l.km),0)+" km"+(syncing?" · Guardando...":""))
        )
      ),
      h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}},
        h("div",{style:{background:"#14532d",border:"1px solid #22c55e",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",color:"#22c55e",fontWeight:"600"}},"☁️ Sheets"),
        h("button",{onClick:loadData,style:{background:"#1e293b",border:"1px solid #334155",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",color:"#94a3b8",cursor:"pointer"}},"🔄")
      )
    ),

    h("div",{style:{display:"flex",margin:"12px 16px 0",background:"#1e293b",borderRadius:"10px",padding:"3px",gap:"2px",overflowX:"auto"}},
      TABS.map(([id,lbl])=>h("button",{key:id,onClick:()=>setTab(id),style:{flex:"0 0 auto",padding:"7px 10px",border:"none",borderRadius:"7px",cursor:"pointer",fontSize:"11px",fontWeight:"600",whiteSpace:"nowrap",background:tab===id?"#3b82f6":"transparent",color:tab===id?"#fff":"#94a3b8"}},lbl))
    ),

    h("div",{style:{padding:"16px"}},

      tab==="home" && h("div",null,
        h(Card,null,
          h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}},
            h("span",{style:{color:"#94a3b8",fontSize:"13px"}},"Bateria actual"),
            h("span",{style:{color:bC,fontWeight:"800",fontSize:"32px"}},currentCharge+"%")
          ),
          h("div",{style:{background:"#0f172a",borderRadius:"8px",height:"20px",overflow:"hidden",marginBottom:"12px"}},
            h("div",{style:{width:`${currentCharge}%`,height:"100%",background:`linear-gradient(90deg,${bC}88,${bC})`,borderRadius:"8px",transition:"width .4s"}})
          ),
          h("div",{style:{display:"flex",gap:"5px",flexWrap:"wrap"}},
            [10,20,25,30,40,50,60,70,80,85,90,100].map(v=>h("button",{key:v,onClick:()=>saveBateria(v),style:{padding:"4px 9px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"600",background:currentCharge===v?bC:"#334155",color:currentCharge===v?"#fff":"#94a3b8"}},v+"%"))
          )
        ),
        h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}},
          [["Autonomia real",eR+" km","#22c55e"],["kWh disponibles",aK+" kWh","#f59e0b"],["Consumo medio",aC!=="--"?aC+" kWh/100":"Sin datos","#a78bfa"],["SOH bateria",soh?soh+"%":"No medido",soh?sC:"#475569"]].map(([lbl,val,color])=>
            h("div",{key:lbl,style:{background:"#1e293b",borderRadius:"14px",padding:"14px",textAlign:"center"}},
              h("div",{style:{color:"#94a3b8",fontSize:"11px",marginBottom:"4px"}},lbl),
              h("div",{style:{fontSize:"19px",fontWeight:"700",color}},val)
            )
          )
        ),
        h("div",{style:{background:currentCharge>=55?"#14532d":"#7f1d1d",border:`1px solid ${currentCharge>=55?"#22c55e":"#ef4444"}`,borderRadius:"12px",padding:"14px",textAlign:"center",marginBottom:"14px"}},
          h("div",{style:{fontWeight:"700"}},currentCharge>=55?"OK para trayecto diario (120 km)":"Bateria insuficiente para 120 km"),
          h("div",{style:{color:"#94a3b8",fontSize:"12px",marginTop:"4px"}},"Minimo 55% · Actual "+currentCharge+"%")
        ),
        registros[0] && h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"10px",fontSize:"14px"}},"Ultimo registro — "+registros[0].fecha),
          h("div",{style:{display:"flex"}},
            [["Bateria",`${registros[0].bateria_salida}%→${registros[0].bateria_llegada}%`,"#3b82f6"],["Km",registros[0].km,"#22c55e"],["kWh/100",registros[0].consumo,registros[0].consumo>18?"#ef4444":registros[0].consumo>15?"#f59e0b":"#22c55e"]].map(([lbl,val,color])=>
              h("div",{key:lbl,style:{flex:1,textAlign:"center"}},
                h("div",{style:{fontWeight:"700",color,fontSize:"13px"}},val),
                h("div",{style:{fontSize:"10px",color:"#64748b"}},lbl)
              )
            )
          )
        ),
        h("div",{style:{background:"#14532d",border:"1px solid #22c55e",borderRadius:"12px",padding:"12px",display:"flex",alignItems:"center",gap:"10px"}},
          h("span",{style:{fontSize:"20px"}},"☁️"),
          h("div",null,
            h("div",{style:{fontWeight:"600",fontSize:"13px"}},"Datos guardados automaticamente"),
            h("div",{style:{color:"#94a3b8",fontSize:"12px"}},"Sincronizado con Google Sheets en tiempo real")
          )
        )
      ),

      tab==="diary" && h("div",null,
        h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"14px"}},editId?"Editando registro":"Registro del trayecto"),
          h(Lbl,null,"Fecha"), h("input",{style:{...iS,marginBottom:"10px"},value:dayF.date,onInput:e=>setDayF(f=>({...f,date:e.target.value}))}),
          h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}},
            h("div",null,h(Lbl,null,"Bateria al salir (%)"),h("input",{style:iS,type:"number",placeholder:"85",value:dayF.startPct,onInput:e=>setDayF(f=>({...f,startPct:e.target.value}))})),
            h("div",null,h(Lbl,null,"Bateria al llegar (%)"),h("input",{style:iS,type:"number",placeholder:"25",value:dayF.endPct,onInput:e=>setDayF(f=>({...f,endPct:e.target.value}))}))
          ),
          h(Lbl,null,"Kilometros"), h("input",{style:{...iS,marginBottom:"10px"},type:"number",placeholder:"60 ida / 120 dia completo",value:dayF.km,onInput:e=>setDayF(f=>({...f,km:e.target.value}))}),
          h(Lbl,null,"Temporada"),
          h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}},
            SEASONS.map(s=>h("button",{key:s.id,onClick:()=>setDayF(f=>({...f,season:s.id})),style:{flex:1,padding:"8px 4px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:"600",minWidth:"70px",background:dayF.season===s.id?s.color:"#334155",color:dayF.season===s.id?"#0f172a":"#94a3b8"}},s.label))
          ),
          h(Lbl,null,"Modo de conduccion"),
          h("div",{style:{display:"flex",gap:"8px",marginBottom:"10px"}},
            MODES.map(m=>h("button",{key:m.id,onClick:()=>setDayF(f=>({...f,mode:m.id})),style:{flex:1,padding:"9px 4px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"600",background:dayF.mode===m.id?m.color:"#334155",color:dayF.mode===m.id?"#fff":"#94a3b8"}},m.label))
          ),
          h(Lbl,null,"Donde cargue?"),
          h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}},
            CLOCS.map(loc=>h("button",{key:loc.id,onClick:()=>setDayF(f=>({...f,chargeLocation:loc.id})),style:{flex:1,padding:"8px 4px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:"600",minWidth:"58px",background:dayF.chargeLocation===loc.id?loc.color:"#334155",color:dayF.chargeLocation===loc.id?"#fff":"#94a3b8"}},loc.label))
          ),
          pC && h("div",{style:{background:"#0f172a",borderRadius:"8px",padding:"10px",marginBottom:"12px",display:"flex",justifyContent:"space-between",fontSize:"13px"}},
            h("span",{style:{color:"#94a3b8"}},"Consumo estimado"),
            h("span",{style:{fontWeight:"700",color:+pC>18?"#ef4444":+pC>15?"#f59e0b":"#22c55e"}},pC+" kWh/100km")
          ),
          h("div",{style:{display:"flex",gap:"8px"}},
            h("button",{style:{...bP,background:syncing?"#334155":"#3b82f6"},onClick:saveDay,disabled:syncing},syncing?"Guardando...":"Guardar en Sheets"),
            editId && h("button",{onClick:()=>{setEditId(null);setDayF({date:tod(),startPct:"",endPct:"",km:"",mode:"eco",chargeLocation:"none",season:getSeasonByMonth()});},style:{...bP,background:"#334155",width:"auto",padding:"10px 14px"}},"X")
          )
        ),
        registros.length===0
          ? h("div",{style:{textAlign:"center",color:"#475569",padding:"30px"}},"Sin registros aun.")
          : h(Card,null,
            h("div",{style:{fontWeight:"700",marginBottom:"14px"}},"Historial — "+registros.length+" registros"),
            registros.map(log=>{
              const m=MODES.find(md=>md.id===log.modo)||MODES[1];
              const loc=CLOCS.find(c=>c.id===log.carga)||CLOCS[0];
              const cc=log.consumo>18?"#ef4444":log.consumo>15?"#f59e0b":"#22c55e";
              return h("div",{key:log.id,style:{borderBottom:"1px solid #334155",paddingBottom:"12px",marginBottom:"12px"}},
                h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}},
                  h("span",{style:{fontWeight:"700"}},log.fecha+" · "+log.km+" km"),
                  h("div",{style:{display:"flex",gap:"5px"}},
                    h("span",{style:{background:m.color+"33",color:m.color,borderRadius:"6px",padding:"2px 7px",fontSize:"11px",fontWeight:"600"}},m.label),
                    h("button",{onClick:()=>editReg(log),style:{background:"#334155",border:"none",borderRadius:"6px",color:"#94a3b8",cursor:"pointer",padding:"3px 7px",fontSize:"11px"}},"✏️"),
                    h("button",{onClick:()=>delReg(log.id),style:{background:"#7f1d1d",border:"none",borderRadius:"6px",color:"#fca5a5",cursor:"pointer",padding:"3px 7px",fontSize:"11px"}},"🗑")
                  )
                ),
                h("div",{style:{display:"flex"}},
                  [["Bateria",`${log.bateria_salida}%→${log.bateria_llegada}%`,"#3b82f6"],["kWh/100",log.consumo,cc],["Carga",loc.label,loc.color]].map(([lbl,val,color])=>
                    h("div",{key:lbl,style:{flex:1,textAlign:"center"}},
                      h("div",{style:{fontWeight:"700",color,fontSize:"13px"}},val),
                      h("div",{style:{fontSize:"10px",color:"#64748b"}},lbl)
                    )
                  )
                )
              );
            })
          )
      ),

      tab==="seasons" && h("div",null, (() => {
        const stats = SEASONS.map(s=>{
          const logs=registros.filter(l=>l.temporada===s.id);
          const avgCons=logs.length?(logs.reduce((a,l)=>a+(+l.consumo),0)/logs.length).toFixed(1):null;
          const totalKm=logs.reduce((a,l)=>a+(+l.km),0);
          const realRange=avgCons?Math.round((BAT/+avgCons)*100):null;
          return{...s,logs,avgCons,totalKm,realRange};
        });
        const cur=SEASONS.find(s=>s.id===getSeasonByMonth());
        const curSt=stats.find(s=>s.id===cur.id);
        const withData=stats.filter(s=>s.logs.length>0);
        return h("div",null,
          h(Card,{style:{border:`2px solid ${cur.color}`}},
            h("div",{style:{fontWeight:"700",fontSize:"15px",marginBottom:"6px"}},"Temporada actual: "+cur.label),
            h("div",{style:{color:"#94a3b8",fontSize:"12px",marginBottom:"10px"}},"Autonomia esperada: "+cur.rangeEst),
            h("div",{style:{background:"#0f172a",borderRadius:"8px",padding:"10px",fontSize:"12px",color:"#94a3b8",marginBottom:"10px"}},cur.tip),
            curSt.logs.length>0
              ? h("div",{style:{display:"flex"}},
                [["Registros",curSt.logs.length,cur.color],["Km",curSt.totalKm+" km",cur.color],["kWh/100",curSt.avgCons,cur.color],["Autonomia",curSt.realRange+" km",cur.color]].map(([lbl,val,color])=>
                  h("div",{key:lbl,style:{flex:1,textAlign:"center"}},
                    h("div",{style:{fontWeight:"700",color,fontSize:"14px"}},val),
                    h("div",{style:{fontSize:"10px",color:"#64748b"}},lbl)
                  )
                )
              )
              : h("div",{style:{color:"#475569",fontSize:"12px",textAlign:"center"}},"Sin registros esta temporada.")
          ),
          h(Card,null,
            h("div",{style:{fontWeight:"700",marginBottom:"14px"}},"Consumo por temporada"),
            stats.map(s=>h("div",{key:s.id,style:{marginBottom:"14px"}},
              h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"4px"}},
                h("span",{style:{fontWeight:"600",color:s.color}},s.label),
                s.avgCons ? h("span",{style:{color:"#94a3b8",fontSize:"11px"}},s.avgCons+" kWh/100 · "+s.logs.length+" reg. · "+s.realRange+" km")
                           : h("span",{style:{color:"#475569",fontSize:"12px"}},"Sin datos")
              ),
              h("div",{style:{background:"#0f172a",borderRadius:"6px",height:"18px",overflow:"hidden"}},
                s.avgCons && h("div",{style:{width:`${(+s.avgCons/25)*100}%`,height:"100%",background:s.color,borderRadius:"6px"}})
              )
            )),
            withData.length>=2 && (() => {
              const best=withData.reduce((a,b)=>+b.avgCons<+a.avgCons?b:a);
              const worst=withData.reduce((a,b)=>+b.avgCons>+a.avgCons?b:a);
              return h("div",{style:{background:"#0f172a",borderRadius:"10px",padding:"12px",fontSize:"12px",marginTop:"4px"}},
                h("div",{style:{marginBottom:"4px"}},"Mejor: ",h("strong",{style:{color:best.color}},best.label)," — "+best.avgCons+" kWh/100 · "+best.realRange+" km"),
                h("div",null,"Peor: ",h("strong",{style:{color:worst.color}},worst.label)," — "+worst.avgCons+" kWh/100 · "+worst.realRange+" km")
              );
            })()
          )
        );
      })()),

      tab==="battery" && h("div",null,
        h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"6px"}},"Salud de la bateria (SOH)"),
          h("div",{style:{color:"#94a3b8",fontSize:"12px",marginBottom:"14px"}},"Carga al 100% y anota cuantos km reales alcanzas hasta llegar a 0%."),
          soh ? h("div",null,
            h("div",{style:{textAlign:"center",marginBottom:"16px"}},
              h("div",{style:{fontSize:"54px",fontWeight:"800",color:sC}},soh+"%"),
              h("div",{style:{color:"#94a3b8",fontSize:"13px"}},"Estado de salud estimado"),
              h("div",{style:{fontSize:"13px",marginTop:"4px"}},"~"+ld.kwh_usables+" kWh · "+ld.autonomia_real+" km reales"),
              h("div",{style:{marginTop:"8px",background:"#0f172a",borderRadius:"8px",padding:"8px",fontSize:"12px"}},
                soh>=85?"Bateria en buen estado":soh>=70?"Degradacion moderada.":"Degradacion severa. Consulta taller."
              )
            ),
            h("div",{style:{position:"relative",marginBottom:"8px"}},
              h("div",{style:{background:"#0f172a",borderRadius:"8px",height:"20px",overflow:"hidden"}},
                h("div",{style:{width:`${soh}%`,height:"100%",background:`linear-gradient(90deg,${sC}88,${sC})`,borderRadius:"8px"}})
              ),
              [70,85].map(mk=>h("div",{key:mk,style:{position:"absolute",left:`${mk}%`,top:0,bottom:0,width:"2px",background:"#475569"}}))
            )
          ) : h("div",{style:{textAlign:"center",padding:"16px",color:"#475569",fontSize:"13px"}},"Sin mediciones. Registra la primera abajo.")
        ),
        h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"14px"}},"Nueva medicion SOH"),
          h(Lbl,null,"Autonomia real (km de 100% a 0%)"), h("input",{style:{...iS,marginBottom:"10px"},type:"number",placeholder:"Ej: 105",value:degF.realRange,onInput:e=>setDegF(f=>({...f,realRange:e.target.value}))}),
          h(Lbl,null,"Fecha"), h("input",{style:{...iS,marginBottom:"10px"},value:degF.date,onInput:e=>setDegF(f=>({...f,date:e.target.value}))}),
          h(Lbl,null,"Condiciones"), h("input",{style:{...iS,marginBottom:"12px"},placeholder:"Ej: primavera, autopista",value:degF.notes,onInput:e=>setDegF(f=>({...f,notes:e.target.value}))}),
          degF.realRange && h("div",{style:{background:"#0f172a",borderRadius:"8px",padding:"10px",marginBottom:"12px",display:"flex",justifyContent:"space-between",fontSize:"13px"}},
            h("span",{style:{color:"#94a3b8"}},"SOH a registrar"),
            h("span",{style:{fontWeight:"700",color:"#22c55e"}},((+degF.realRange/RANGE)*100).toFixed(1)+"%")
          ),
          h("button",{style:{...bP,background:syncing?"#334155":"#3b82f6"},onClick:saveDeg,disabled:syncing},syncing?"Guardando...":"Guardar medicion")
        ),
        sohList.length>0 && h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"12px"}},"Historial SOH"),
          sohList.map(d=>h("div",{key:d.id,style:{borderBottom:"1px solid #334155",paddingBottom:"10px",marginBottom:"10px"}},
            h("div",{style:{display:"flex",justifyContent:"space-between"}},
              h("span",{style:{fontWeight:"600",color:d.soh>=85?"#22c55e":d.soh>=70?"#f59e0b":"#ef4444"}},"SOH "+d.soh+"%"),
              h("span",{style:{color:"#94a3b8",fontSize:"12px"}},d.fecha)
            ),
            h("div",{style:{fontSize:"12px",color:"#94a3b8"}},d.autonomia_real+" km · "+d.kwh_usables+" kWh"+(d.notas?" · "+d.notas:""))
          ))
        )
      ),

      tab==="map" && h("div",null,
        h("div",{style:{fontWeight:"700",fontSize:"15px",marginBottom:"6px"}},"Puntos de carga — C. Valenciana"),
        h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}},
          [["all","Todos"],["Sueca","Sueca"],["Puzol","Puzol"],["Sagunto","Sagunto"],["Valencia","Valencia"],["Iberdrola","Iberdrola"],["ok","Activos"]].map(([id,lbl])=>
            h("button",{key:id,onClick:()=>{setZoneF(id);setSelSt(null);},style:{padding:"5px 11px",borderRadius:"20px",border:"1px solid #334155",background:zoneF===id?"#3b82f6":"transparent",color:zoneF===id?"#fff":"#94a3b8",cursor:"pointer",fontSize:"11px",fontWeight:"600"}},lbl)
          )
        ),
        filtSt.map((s,i)=>h("div",{key:i,onClick:()=>setSelSt(selSt?.name===s.name?null:s),style:{background:"#1e293b",borderRadius:"14px",padding:"14px",marginBottom:"10px",cursor:"pointer",border:`1px solid ${selSt?.name===s.name?"#3b82f6":"#334155"}`}},
          h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
            h("div",{style:{flex:1}},
              h("div",{style:{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}},
                h("div",{style:{width:"10px",height:"10px",borderRadius:"50%",background:SCOL[s.status],flexShrink:0}}),
                h("span",{style:{fontWeight:"700",fontSize:"13px"}},s.name)
              ),
              h("div",{style:{fontSize:"12px",color:"#94a3b8"}},s.addr)
            ),
            s.rating && h("span",{style:{color:"#f59e0b",fontSize:"12px",fontWeight:"600"}},"⭐ "+s.rating)
          ),
          selSt?.name===s.name && h("div",{style:{marginTop:"12px",borderTop:"1px solid #334155",paddingTop:"12px"}},
            h(Row,{label:"Red",value:s.network}),
            h(Row,{label:"Horario",value:s.hours}),
            h(Row,{label:"Conectores",value:s.conn}),
            h(Row,{label:"Estado",value:SLAB[s.status],color:SCOL[s.status]}),
            h(Row,{label:"Notas",value:s.notes}),
            h("a",{href:`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`,target:"_blank",rel:"noopener noreferrer",style:{display:"block",background:"#3b82f6",color:"#fff",borderRadius:"8px",padding:"10px",textAlign:"center",fontWeight:"700",fontSize:"13px",textDecoration:"none",marginTop:"12px"}},"Abrir en Google Maps")
          )
        ))
      ),

      tab==="advisor" && h("div",{style:{display:"flex",flexDirection:"column",height:"calc(100vh - 210px)"}},
        h(Card,{style:{marginBottom:"10px"}},
          h("div",{style:{fontWeight:"700",fontSize:"14px",marginBottom:"4px"}},"Smart Advisor — e-up! 2014"),
          h("div",{style:{color:"#94a3b8",fontSize:"12px"}},"Analiza tus datos reales de Google Sheets.")
        ),
        h("div",{style:{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}},
          ["Cuanta autonomia me queda?","Consejos para ahorrar bateria","Cuando debo recargar?","Como va mi degradacion?"].map(q=>
            h("button",{key:q,onClick:()=>setAiIn(q),style:{background:"#1e293b",border:"1px solid #334155",borderRadius:"20px",padding:"5px 10px",fontSize:"11px",color:"#93c5fd",cursor:"pointer"}},q)
          )
        ),
        h("div",{ref:chatRef,style:{flex:1,overflowY:"auto",background:"#0f172a",borderRadius:"12px",padding:"12px",marginBottom:"10px",display:"flex",flexDirection:"column",gap:"10px"}},
          aiMsgs.map((m,i)=>h("div",{key:i,style:{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}},
            h("div",{style:{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"#3b82f6":"#1e293b",fontSize:"13px",lineHeight:"1.6"}},m.content)
          )),
          aiLoad && h("div",{style:{display:"flex"}},h("div",{style:{background:"#1e293b",padding:"10px 14px",borderRadius:"16px 16px 16px 4px",fontSize:"13px",color:"#94a3b8"}},"Analizando..."))
        ),
        h("div",{style:{display:"flex",gap:"8px"}},
          h("input",{style:{...iS,flex:"1"},placeholder:"Pregunta sobre tu vehiculo...",value:aiIn,onInput:e=>setAiIn(e.target.value),onKeyDown:e=>e.key==="Enter"&&sendAI()}),
          h("button",{onClick:sendAI,disabled:aiLoad,style:{background:aiLoad?"#334155":"#3b82f6",border:"none",borderRadius:"8px",padding:"0 16px",cursor:aiLoad?"not-allowed":"pointer",fontSize:"18px",color:"#fff"}},"➤")
        )
      ),

      tab==="stats" && h("div",null,
        h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}},
          [["Registros",registros.length,"#3b82f6"],["Km totales",registros.reduce((s,l)=>s+(+l.km),0)+" km","#22c55e"],["En ECO",registros.filter(l=>l.modo==="eco").length,"#22c55e"],["SOH",soh?soh+"%":"--",soh?sC:"#475569"]].map(([lbl,val,color])=>
            h("div",{key:lbl,style:{background:"#1e293b",borderRadius:"14px",padding:"14px",textAlign:"center"}},
              h("div",{style:{color:"#94a3b8",fontSize:"11px",marginBottom:"4px"}},lbl),
              h("div",{style:{fontSize:"20px",fontWeight:"700",color}},val)
            )
          )
        ),
        registros.length>0 && h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"12px"}},"Consumo por registro"),
          registros.slice(0,10).map(log=>{
            const color=log.consumo>18?"#ef4444":log.consumo>15?"#f59e0b":"#22c55e";
            return h("div",{key:log.id,style:{marginBottom:"8px"}},
              h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"3px"}},
                h("span",{style:{color:"#94a3b8"}},log.fecha+" · "+log.km+" km"),
                h("span",{style:{color,fontWeight:"700"}},log.consumo+" kWh/100")
              ),
              h("div",{style:{background:"#0f172a",borderRadius:"4px",height:"6px"}},
                h("div",{style:{width:`${Math.min(log.consumo/25*100,100)}%`,height:"100%",borderRadius:"4px",background:color}})
              )
            );
          })
        ),
        h(Card,null,
          h("div",{style:{fontWeight:"700",marginBottom:"12px"}},"Modos de conduccion"),
          MODES.map(m=>{
            const cnt=registros.filter(l=>l.modo===m.id).length;
            const pct=registros.length?Math.round(cnt/registros.length*100):0;
            return h("div",{key:m.id,style:{marginBottom:"10px"}},
              h("div",{style:{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"3px"}},
                h("span",{style:{color:m.color,fontWeight:"600"}},m.label),
                h("span",{style:{color:"#94a3b8"}},cnt+" registros ("+pct+"%)")
              ),
              h("div",{style:{background:"#0f172a",borderRadius:"4px",height:"8px"}},
                h("div",{style:{width:`${pct}%`,height:"100%",borderRadius:"4px",background:m.color}})
              )
            );
          })
        )
      )
    ),

    h("div",{style:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:"480px",background:"#0f172a",borderTop:"1px solid #1e293b",padding:"8px 0",textAlign:"center"}},
      h("span",{style:{fontSize:"11px",color:"#475569"}},"VW e-up! · Datos en Google Sheets · Sin copiar y pegar")
    )
  );
}

render(h(App, null), document.getElementById("root"));
