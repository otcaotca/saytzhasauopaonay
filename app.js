const form=document.querySelector("#form");
const promptEl=document.querySelector("#prompt");
const messages=document.querySelector("#messages");
const frame=document.querySelector("#frame");
const statusEl=document.querySelector("#status");
const publish=document.querySelector("#publish");
let currentHTML="";

function msg(text,type){const d=document.createElement("div");d.className=`msg ${type}`;d.textContent=text;messages.appendChild(d);messages.scrollTop=messages.scrollHeight}

form.addEventListener("submit",async e=>{
  e.preventDefault();
  const prompt=promptEl.value.trim(); if(!prompt)return;
  msg(prompt,"user"); promptEl.value=""; statusEl.textContent="AI жасап жатыр...";
  try{
    const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});
    const data=await r.json(); if(!r.ok)throw new Error(data.error||"Қате");
    currentHTML=data.html; frame.srcdoc=currentHTML; statusEl.textContent="Дайын ✓";
    msg("Дайын! ✨ Preview жаңартылды. Енді сайтты жариялай аласыз.","ai");
  }catch(err){statusEl.textContent="Қате";msg(err.message,"ai")}
});

publish.addEventListener("click",async()=>{
  if(!currentHTML){msg("Алдымен сайт жасаңыз.","ai");return}
  statusEl.textContent="Жарияланып жатыр...";
  try{
    const r=await fetch("/api/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:currentHTML,title:"AI сайт"})});
    const data=await r.json(); if(!r.ok)throw new Error(data.error||"Қате");
    const full=new URL(data.url,location.origin).href;
    statusEl.textContent="Жарияланды ✓";
    msg(`🎉 Сайт жарияланды: ${full}`,"ai");
    window.prompt("Сайттың сілтемесі:",full);
  }catch(err){statusEl.textContent="Қате";msg(err.message,"ai")}
});