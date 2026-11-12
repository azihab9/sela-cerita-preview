const views=[...document.querySelectorAll(".view")];
const links=[...document.querySelectorAll("[data-view]")];
const crumb=document.querySelector("#crumb");
const sidebar=document.querySelector("#sidebar");
const toast=document.querySelector("#toast");
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),3000)}
function showView(id){const target=document.getElementById(id);if(!target||!target.classList.contains("view"))return;views.forEach(v=>v.classList.toggle("active-view",v===target));links.forEach(a=>a.classList.toggle("active",a.dataset.view===id));crumb.textContent=({overview:"Dashboard",projects:"Ceritaku",templates:"Pilih template",orders:"Pesanan",settings:"Pengaturan",help:"Bantuan"})[id]||"Dashboard";history.replaceState(null,"","#"+id);sidebar.classList.remove("open");window.scrollTo({top:0,behavior:"smooth"})}
links.forEach(a=>a.addEventListener("click",e=>{e.preventDefault();showView(a.dataset.view)}));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
document.querySelector("#mobile-menu").addEventListener("click",()=>sidebar.classList.toggle("open"));
document.querySelector("#year").textContent=new Date().getFullYear();

const cfg=window.SELA_SUPABASE_CONFIG||{};
const configured=window.supabase&&cfg.url&&cfg.anonKey&&!cfg.url.includes("YOUR_")&&!cfg.anonKey.includes("YOUR_");
if(!configured){document.body.innerHTML='<main style="font-family:Arial;padding:40px;color:#292526"><h2>Konfigurasi Supabase belum tersedia</h2><p>Periksa app/supabase-config.js lalu muat ulang halaman.</p></main>';throw new Error("Supabase configuration missing");}
const db=window.supabase.createClient(cfg.url,cfg.anonKey);
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const templateMeta={
 bloom:{name:"Bloom",kind:"01 / THE ROMANTIC",headline:"To my<br><i>favorite</i><br>person. ♡",className:"bloom-art"},
 chapter:{name:"Chapter",kind:"02 / THE EDITORIAL",headline:"CHAPTER<br><i>of us.</i>",className:"chapter-art"},
 playdate:{name:"Playdate",kind:"03 / THE PLAYFUL",headline:"GOOD<br>TIMES<br><i>only!</i>",className:"playdate-art"}
};
let currentUser=null;
function projectCard(project){
 const meta=templateMeta[project.template_id]||templateMeta.bloom;
 const published=project.status==="published";
 return '<article class="project-card"><div class="project-art '+meta.className+'"><span>'+meta.kind+'</span><div>'+meta.headline+'</div><small>'+meta.name.toUpperCase()+' TEMPLATE</small></div><div class="project-info"><div><h3>'+escapeHtml(project.title)+'</h3><p>'+meta.name+' · '+(published?"Website terbit":"Project pribadi")+'</p></div><span class="status '+(published?"published":"draft")+'">'+(published?"Terbit":"Draft")+'</span></div><button class="card-action" data-project-id="'+escapeHtml(project.id)+'">Buka project ↗</button></article>';
}
function renderProjects(projects){
 const recent=document.querySelector("#recent-projects"),all=document.querySelector("#all-projects");
 const cards=projects.map(projectCard).join("");
 const empty='<div class="empty-state"><span>♡</span><h2>Belum ada cerita</h2><p>Pilih template pertamamu dan mulai merangkai cerita.</p><button class="primary-button" data-go="templates">Jelajahi template</button></div>';
 recent.innerHTML=cards?projects.slice(0,2).map(projectCard).join("")+'<button class="new-project-card" data-go="templates"><span>＋</span><b>Buat cerita baru</b><small>Pilih template untuk memulai</small></button>':empty;
 all.innerHTML=cards?cards+'<button class="new-project-card" data-go="templates"><span>＋</span><b>Buat cerita baru</b><small>Pilih template untuk memulai</small></button>':empty;
 document.querySelector("#project-count").textContent=projects.length;
 document.querySelector("#all-project-count").textContent=projects.length;
 document.querySelector("#draft-count").textContent=projects.filter(p=>p.status==="draft"||p.status==="pending_payment").length;
 document.querySelector("#published-count").textContent=projects.filter(p=>p.status==="published").length;
 document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.go)));
 document.querySelectorAll("[data-project-id]").forEach(b=>b.addEventListener("click",()=>{location.href="editor.html?id="+encodeURIComponent(b.dataset.projectId);}));
}
async function loadTemplates(){
 const grid=document.querySelector("#template-grid");
 const {data,error}=await db.from("templates").select("id,name,description").eq("is_active",true).order("name");
 if(error){grid.innerHTML='<p class="loading-state">Template belum dapat dimuat: '+escapeHtml(error.message)+'</p>';return;}
 grid.innerHTML=(data||[]).map(t=>{const meta=templateMeta[t.id]||templateMeta.bloom;return '<article class="template-option"><div class="project-art '+meta.className+'"><span>'+meta.kind+'</span><div>'+meta.headline+'</div><small>'+escapeHtml(t.name).toUpperCase()+' TEMPLATE</small></div><h3>'+escapeHtml(t.name)+'</h3><p>'+escapeHtml(t.description||"Personalize this template.")+'</p><button class="primary-button choose-template" data-template="'+escapeHtml(t.id)+'">Pilih '+escapeHtml(t.name)+' ↗</button></article>'}).join("");
 grid.querySelectorAll(".choose-template").forEach(button=>button.addEventListener("click",()=>createProject(button.dataset.template)));
}
async function createProject(templateId){
 const template=templateMeta[templateId];if(!template){notify("Template tidak ditemukan.");return;}
 const title=prompt("Beri nama untuk website barumu:",template.name+" — Cerita Baru");
 if(title===null)return;
 const cleanTitle=title.trim()||"Cerita Baru";
 const {data,error}=await db.from("projects").insert({owner_id:currentUser.id,template_id:templateId,title:cleanTitle,content:{}}).select().single();
 if(error){notify("Project belum bisa dibuat: "+error.message);return;}
 notify("Project "+cleanTitle+" berhasil dibuat!");
 await loadProjects();showView("projects");
}
async function loadProjects(){
 const {data,error}=await db.from("projects").select("id,title,template_id,status,created_at,updated_at").order("updated_at",{ascending:false});
 if(error){notify("Gagal memuat project: "+error.message);return;}
 renderProjects(data||[]);
}
async function init(){
 const {data:{session},error}=await db.auth.getSession();
 if(error||!session){location.replace("auth.html");return;}
 currentUser=session.user;
 const displayName=session.user.user_metadata?.display_name||session.user.email?.split("@")[0]||"Teman cerita";
 document.querySelector("#user-name").textContent=displayName;
 document.querySelector("#user-email").textContent=session.user.email||"";
 document.querySelector("#user-avatar").textContent=displayName.slice(0,2).toUpperCase();
 document.querySelector("#logout-button").addEventListener("click",async()=>{const {error}=await db.auth.signOut();if(error){notify(error.message);return;}location.replace("auth.html");});
 await Promise.all([loadProjects(),loadTemplates()]);
 const initial=location.hash.replace("#","");if(initial)showView(initial);
 db.auth.onAuthStateChange((event)=>{if(event==="SIGNED_OUT")location.replace("auth.html");});
}
init();
