import React from "react";
import { T } from "../theme.js";
import { Eyebrow, Card } from "../ui/index.js";
import { ClipboardList, FileText, Target, Users, Pin } from "lucide-react";

function ActivityFeed({ activityLog, users, onMarkSeen }) {
  const recent = activityLog.slice(0, 20);
  const unseen = activityLog.filter(a => !a.seen).length;

  // Un emoji lo dibuja el sistema operativo y cambia de forma entre plataformas;
// un icono vectorial hereda color y tamano del texto que acompana.
const TYPE_ICON = { session: ClipboardList, document: FileText, objective: Target, meeting: Users };

  const timeAgo = (ts) => {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs/24)}d`;
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Eyebrow>Actividad reciente</Eyebrow>
          {unseen > 0 && (
            <span style={{ background:T.brand, color:"#fff", fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20 }}>{unseen}</span>
          )}
        </div>
        {unseen > 0 && (
          <button onClick={onMarkSeen} style={{ background:"none", border:"none", fontSize:12, color:T.brand, cursor:"pointer", fontFamily:T.font, fontWeight:600 }}>
            Marcar todo como visto
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div style={{ fontSize:13, color:T.inkFaint, padding:"12px 0", textAlign:"center" }}>Sin actividad reciente</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {recent.map((act, i) => {
            const sp = users.find(u => u.id === act.specialistId);
            return (
              <div key={act.id} style={{
                display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0",
                opacity: act.seen ? 0.6 : 1,
              }}>
                <div style={{ display: "flex", flexShrink: 0, marginTop: 2, color: T.inkFaint }}>
                  {React.createElement(TYPE_ICON[act.type] || Pin, { size: 15 })}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>
                    {act.childName}
                    {!act.seen && <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:T.brand, marginLeft:6, verticalAlign:"middle" }} />}
                  </div>
                  <div style={{ fontSize:12, color:T.inkSoft, marginTop:1 }}>
                    {act.description} · {sp ? sp.name.split(" ")[0] : "—"}
                  </div>
                </div>
                <div style={{ fontSize:11, color:T.inkFaint, flexShrink:0, whiteSpace:"nowrap" }}>{timeAgo(act.timestamp)}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default ActivityFeed;
