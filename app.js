const API = "https://alejandro7016.pythonanywhere.com";
const TOKEN_KEY = "cx_token";

function setMsg(el, text, ok=true){
  el.textContent = text;
  el.className = ok ? "good" : "bad";
}
function getToken(){ return localStorage.getItem(TOKEN_KEY); }
function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
function clearToken(){ localStorage.removeItem(TOKEN_KEY); }

async function postJSON(path, body){
  const res = await fetch(API + path, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

window.login = async function(){
  try{
    const r = await postJSON("/api/auth/login", { email: authEmail.value, password: authPass.value });
    setToken(r.token);
    setMsg(authMsg, "✅ Login correcto");
  }catch(e){
    setMsg(authMsg, "❌ " + e.message, false);
  }
};

window.register = async function(){
  try{
    const r = await postJSON("/api/auth/register", { name:"Cliente", email: authEmail.value, password: authPass.value });
    setToken(r.token);
    setMsg(authMsg, "✅ Cuenta creada y login correcto");
  }catch(e){
    setMsg(authMsg, "❌ " + e.message, false);
  }
};

window.logout = function(){
  clearToken();
  setMsg(authMsg, "✅ Logout");
};

window.getQuote = async function(){
  try{
    const r = await postJSON("/api/quote", {
      destination_rd: qDest.value,
      weight_lb: Number(qWeight.value),
      mode: qMode.value
    });
    quoteMsg.textContent = `Costo estimado: RD$ ${r.estimated_cost_rd} | ${r.eta}`;
  }catch(e){
    quoteMsg.textContent = "❌ " + e.message;
  }
};

window.track = async function(){
  try{
    const res = await fetch(API + "/api/track/" + encodeURIComponent(trk.value));
    trkOut.textContent = JSON.stringify(await res.json(), null, 2);
  }catch(e){
    trkOut.textContent = "❌ " + e.message;
  }
};

window.uploadImage = async function(){
  try{
    if(!img.files.length) return alert("Selecciona una imagen");
    const fd = new FormData();
    fd.append("file", img.files[0]);

    const res = await fetch(API + "/api/upload", { method:"POST", body: fd });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.detail || "Error upload");

    upMsg.innerHTML = `✅ Subida OK: ${API}${data.url}${API}${data.url}</a>`;
  }catch(e){
    upMsg.textContent = "❌ " + e.message;
  }
};