const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'code-analysis', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '      {/* ── BEGINNER GUIDE TAB ─────────────────────────────────────────────── */}';
const endMarker = '      })()}';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx) + endMarker.length;

if (startIdx === -1) { console.error('START MARKER NOT FOUND'); process.exit(1); }
if (endIdx === endMarker.length - 1) { console.error('END MARKER NOT FOUND'); process.exit(1); }

const replacement = [
  '      {/* ── BEGINNER GUIDE TAB ─────────────────────────────────────────────── */}',
  '      {pageTab === "learn" && (',
  '        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100dvh - 96px)",background:"#0d0f1a",overflowY:"auto",padding:24}}>',
  '          <div style={{maxWidth:860,width:"100%",padding:"36px 40px",borderRadius:16,background:"linear-gradient(135deg,rgba(245,158,11,0.08),rgba(232,121,249,0.06),rgba(79,142,247,0.06))",border:"1px solid rgba(245,158,11,0.25)",textAlign:"center",marginBottom:32}}>',
  '            <div style={{fontSize:48,marginBottom:16}}>🧩</div>',
  '            <h1 style={{fontSize:28,fontWeight:900,color:"#eaedf8",margin:"0 0 10px",letterSpacing:"-0.5px"}}>Zero → Enterprise AI Agent Platform</h1>',
  '            <p style={{fontSize:15,color:"#9aa3c0",lineHeight:1.8,margin:"0 0 24px",maxWidth:640,marginLeft:"auto",marginRight:"auto"}}>',
  '              An immersive, hands-on learning environment. <strong style={{color:"#f59e0b"}}>Drag real LEGO blocks</strong> to design your agent architecture,',
  '              follow <strong style={{color:"#e879f9"}}>12 comprehensive modules</strong> from LLM basics to fine-tuning,',
  '              and use the <strong style={{color:"#34d399"}}>35-step guided builder</strong> to ship a production agent by the end of the session.',
  '            </p>',
  '            <button',
  '              onClick={() => window.open("/learn", "_blank")}',
  '              style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:800,cursor:"pointer",background:"linear-gradient(135deg,#f59e0b,#e879f9)",border:"none",color:"#0d0f1a",boxShadow:"0 4px 24px rgba(245,158,11,0.3)"}}',
  '            >🚀 Launch Full Experience →</button>',
  '            <div style={{fontSize:11,color:"#4a5270",marginTop:12}}>Opens in a new tab — full-screen, drag-and-drop enabled</div>',
  '          </div>',
  '          <div style={{maxWidth:860,width:"100%",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>',
  '            {[',
  '              {icon:"🧩",color:"#f59e0b",title:"LEGO Canvas",desc:"Drag 40+ AI blocks onto a live canvas and wire them up. Get fully generated TypeScript code, Dockerfile, and CI/CD tailored to your exact stack."},',
  '              {icon:"📚",color:"#a78bfa",title:"12 Deep Modules",desc:"LLM Foundations → RAG → Orchestration → MCP → A2A → Evaluation → Fine-tuning → Monitoring. Each module has code, analogies, stack tables, and quizzes."},',
  '              {icon:"🔨",color:"#34d399",title:"35-Step Builder",desc:"Build a Research Intelligence Agent from zero. Every step has exact terminal commands and full copy-paste file content. Deploy to Vercel by step 35."},',
  '              {icon:"⚡",color:"#38bdf8",title:"Live Code Generation",desc:"Canvas generates package.json, TypeScript sources, .env.example, Dockerfile, and GitHub Actions YAML — tailored to your block selection."},',
  '              {icon:"📊",color:"#fb923c",title:"Evaluation & Fine-tuning",desc:"LLM-as-judge, RAGAS metrics, dataset curation, LoRA/QLoRA fine-tuning, and measuring improvement before and after."},',
  '              {icon:"🏢",color:"#e879f9",title:"Enterprise to Local Stacks",desc:"6 deployment paths: Vercel+Neon, Google Cloud, OpenAI Classic, Full OSS, Local Ollama, Enterprise K8s. Every layer is swappable."},',
  '            ].map((f,i)=>(',
  '              <div key={i} style={{padding:"18px 20px",borderRadius:10,background:"#12141f",border:"1px solid " + f.color + "22"}}>',
  '                <div style={{fontSize:22,marginBottom:8}}>{f.icon}</div>',
  '                <div style={{fontSize:13,fontWeight:800,color:f.color,marginBottom:6}}>{f.title}</div>',
  '                <div style={{fontSize:12,color:"#7d88a8",lineHeight:1.65}}>{f.desc}</div>',
  '              </div>',
  '            ))}',
  '          </div>',
  '        </div>',
  '      )}',
].join('\n');

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(filePath, content, 'utf8');
console.log('DONE. File size:', content.length);
