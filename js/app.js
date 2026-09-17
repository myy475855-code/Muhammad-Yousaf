const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let profile, skills, projects, experience, education, certificates;
let currentProjectFilter = "All";
let currentSkillFilter = "All";

async function loadJSON(file){ const r = await fetch(`data/${file}`); if(!r.ok) throw new Error(file); return r.json(); }

async function init(){
  [profile, skills, projects, experience, education, certificates] = await Promise.all([
    loadJSON("profile.json"), loadJSON("skills.json"), loadJSON("projects.json"),
    loadJSON("experience.json"), loadJSON("education.json"), loadJSON("certificates.json")
  ]);
  $("#aboutText").textContent = profile.bio;
  renderSkillFilters(); renderSkills();
  renderProjectFilters(); renderProjects();
  renderExperience(); renderEducation(); renderCertificates();
  startTypewriter(); setupReveal(); setupNav(); setupParticles();
  $("#year").textContent = new Date().getFullYear();
}
function renderSkillFilters(){
  const groups=["All",...new Set(skills.map(s=>s.group))];
  $("#skillFilters").innerHTML=groups.map((g,i)=>`<button class="${i===0?"active":""}" data-skill-filter="${g}">${g}</button>`).join("");
  $$("[data-skill-filter]").forEach(b=>b.onclick=()=>{currentSkillFilter=b.dataset.skillFilter;$$("[data-skill-filter]").forEach(x=>x.classList.toggle("active",x===b));renderSkills()});
}
function renderSkills(){
  const list=currentSkillFilter==="All"?skills:skills.filter(s=>s.group===currentSkillFilter);
  $("#skillsGrid").innerHTML=list.map(s=>`
    <article class="skill-card reveal">
      <div class="skill-head"><span class="skill-name"><i class="bi ${s.icon} skill-icon"></i>${s.name}</span><span class="skill-percent">${s.level}%</span></div>
      <div class="skill-bar"><div class="skill-fill" data-level="${s.level}"></div></div>
    </article>`).join("");
  requestAnimationFrame(()=>{$$(".skill-fill").forEach(x=>x.style.width=x.dataset.level+"%")});
  setupReveal();
}
function renderProjectFilters(){
  const groups=["All",...new Set(projects.map(p=>p.category))];
  $("#projectFilters").innerHTML=groups.map((g,i)=>`<button class="${i===0?"active":""}" data-project-filter="${g}">${g}</button>`).join("");
  $$("[data-project-filter]").forEach(b=>b.onclick=()=>{currentProjectFilter=b.dataset.projectFilter;$$("[data-project-filter]").forEach(x=>x.classList.toggle("active",x===b));renderProjects()});
  $("#projectSearch").addEventListener("input",renderProjects);
}
function renderProjects(){
  const q=($("#projectSearch")?.value||"").toLowerCase().trim();
  let list=projects.filter(p=>currentProjectFilter==="All"||p.category===currentProjectFilter)
    .filter(p=>(p.title+" "+p.description+" "+p.tech.join(" ")).toLowerCase().includes(q));
  $("#projectsGrid").innerHTML=list.map((p,i)=>`
    <article class="project-card reveal">
      ${p.featured?'<span class="featured">FEATURED</span>':""}
      <div class="project-top"><span class="project-index">PROJECT ${String(i+1).padStart(2,"0")}</span><i class="bi bi-arrow-up-right" style="color:var(--muted)"></i></div>
      <h3 class="project-title">${p.title}</h3>
      <p class="project-desc">${p.description}</p>
      <div class="tag-list">${p.tech.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div class="project-actions">
        <a href="${p.github}" target="_blank" rel="noopener"><i class="bi bi-github"></i> Repository</a>
        <button class="details-btn" data-project="${projects.indexOf(p)}">Details</button>
      </div>
    </article>`).join("") || `<div class="glass-card p-4 text-center" style="grid-column:1/-1;color:var(--muted)">No projects found.</div>`;
  $$("[data-project]").forEach(b=>b.onclick=()=>openProject(+b.dataset.project));
  setupReveal();
}
function openProject(i){
  const p=projects[i]; $("#modalTitle").textContent=p.title;$("#modalDescription").textContent=p.description;
  $("#modalTech").innerHTML=p.tech.map(t=>`<span class="tag">${t}</span>`).join("");$("#modalGithub").href=p.github;
  bootstrap.Modal.getOrCreateInstance($("#projectModal")).show();
}
function renderExperience(){
  $("#experienceList").innerHTML=experience.map(e=>`<div class="timeline-item reveal"><span class="period">${e.period}</span><h3>${e.role}</h3><span class="company">${e.company}</span><p>${e.description}</p></div>`).join("");
}
function renderEducation(){
  $("#educationList").innerHTML=education.map(e=>`<div class="edu-item"><span class="period">${e.period}</span><h3>${e.degree}</h3><p>${e.school}</p>${e.meta?`<small>${e.meta}</small>`:""}</div>`).join("");
}
function renderCertificates(){
  $("#certGrid").innerHTML=certificates.map(c=>`<article class="cert-card reveal"><i class="bi bi-patch-check cert-icon"></i><h3>${c.title}</h3><p>${c.provider}</p><a href="${c.url}" target="_blank" rel="noopener">View Certificate <i class="bi bi-arrow-up-right"></i></a></article>`).join("");
}
function startTypewriter(){
  const el=$("#typewriter"), msgs=profile.typing;let mi=0,ci=0,del=false;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;if(reduced){el.textContent=msgs[0];return}
  function tick(){const m=msgs[mi];el.textContent=del?m.slice(0,ci--):m.slice(0,ci++);
    if(!del&&ci>m.length){del=true;return setTimeout(tick,1200)}
    if(del&&ci<0){del=false;ci=0;mi=(mi+1)%msgs.length}
    setTimeout(tick,del?25:45)} tick();
}
function setupReveal(){
  const els=$$(".reveal:not(.observe-ready)");els.forEach(el=>el.classList.add("observe-ready"));
  if(!("IntersectionObserver" in window)){els.forEach(e=>e.classList.add("in"));return}
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
  els.forEach(e=>io.observe(e));
}
function setupNav(){
  const nav=$("#mainNav"), progress=$("#scrollProgress"), back=$("#backTop"), links=$$(".nav-link");
  addEventListener("scroll",()=>{
    nav.classList.toggle("scrolled",scrollY>20);back.classList.toggle("show",scrollY>500);
    progress.style.width=(scrollY/(document.documentElement.scrollHeight-innerHeight)*100)+"%";
    let active="home";["home","about","skills","projects","experience","certificates","contact"].forEach(id=>{const s=$("#"+id);if(s&&scrollY>=s.offsetTop-150)active=id});
    links.forEach(l=>l.classList.toggle("active",l.getAttribute("href")==="#"+active));
  },{passive:true});
  back.onclick=()=>scrollTo({top:0,behavior:"smooth"});
  $$(".nav-link").forEach(l=>l.addEventListener("click",()=>$("#navMenu").classList.remove("show")));
}
function setupParticles(){
  const canvas=$("#particles"),ctx=canvas.getContext("2d"),reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w,h,pts=[];
  function resize(){w=canvas.width=innerWidth;h=canvas.height=innerHeight;pts=Array.from({length:45},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.4+.4}))}
  function draw(){ctx.clearRect(0,0,w,h);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle="rgba(120,170,200,.35)";ctx.fill()});
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){let a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<120){ctx.strokeStyle=`rgba(98,216,255,${.07*(1-d/120)})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
    if(!reduced)requestAnimationFrame(draw)
  } resize();draw();addEventListener("resize",resize);
}
init().catch(err=>{
  console.error(err);
  document.querySelector("main").insertAdjacentHTML("afterbegin",'<div class="container pt-5"><div class="alert alert-warning mt-5">JSON data could not be loaded. Run this project with VS Code Live Server or another local web server.</div></div>');
});
