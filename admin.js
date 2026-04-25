const API = "https://alejandro7016.pythonanywhere.com";
const token = localStorage.getItem("cx_token");

function authHeaders(extra = {}) {
  const h = { ...extra };
  if (token) h["Authorization"] = "Bearer " + token;
  return h;
}

async function getJSON(path) {
  const res = await fetch(API + path, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

async function postJSON(path, bodyObj) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(bodyObj),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

async function putJSON(path, bodyObj) {
  const res = await fetch(API + path, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(bodyObj),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

async function putForm(path, formObj) {
  const fd = new FormData();
  Object.entries(formObj).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(API + path, {
    method: "PUT",
    headers: authHeaders(),
    body: fd
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

async function delReq(path) {
  const res = await fetch(API + path, {
    method: "DELETE",
    headers: authHeaders()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || "Error");
  return data;
}

btnMe.onclick = async () => {
  try { out.textContent = JSON.stringify(await getJSON("/api/auth/me"), null, 2); }
  catch (e) { out.textContent = e.message; }
};

btnStats.onclick = async () => {
  try { out.textContent = JSON.stringify(await getJSON("/api/admin/stats"), null, 2); }
  catch (e) { out.textContent = e.message; }
};

async function loadUsers() {
  const msg = document.getElementById("usersMsg");
  msg.textContent = "Cargando usuarios...";
  msg.className = "";

  try {
    const data = await getJSON("/api/admin/users");
    users.innerHTML = data.users.map(u => `
      <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:10px 0;">
        <b>${u.email}</b> — rol: <b>${u.role}</b><br/>
        <small>ID: ${u.id}</small><br/>
        <small>Creado: ${u.created_at}</small>

        <div class="row" style="margin-top:10px;">
          <button onclick="setRole('${u.id}','admin')">Hacer admin</button>
          <button onclick="setRole('${u.id}','client')">Hacer client</button>
        </div>

        <div style="margin-top:10px;">
          <input id="pass-${u.id}" type="password" placeholder="Nuevo password"/>
          <button onclick="resetPass('${u.id}')">Reset password</button>
        </div>

        <button style="margin-top:10px;background:#ffe6e6;" onclick="deleteUser('${u.id}')">
          Eliminar usuario
        </button>
      </div>
    `).join("");

    msg.textContent = "Usuarios cargados ✅";
    msg.className = "good";
  } catch (e) {
    msg.textContent = "❌ " + e.message;
    msg.className = "bad";
  }
}

btnUsers.onclick = loadUsers;

btnCreateUser.onclick = async () => {
  const msg = document.getElementById("usersMsg");
  msg.textContent = "Creando usuario...";
  msg.className = "";

  try {
    await postJSON("/api/admin/users", {
      name: newName.value,
      email: newEmail.value,
      password: newPass.value,
      role: newRole.value
    });
    msg.textContent = "✅ Usuario creado";
    msg.className = "good";
    newName.value = ""; newEmail.value = ""; newPass.value = "";
    await loadUsers();
  } catch (e) {
    msg.textContent = "❌ " + e.message;
    msg.className = "bad";
  }
};

window.setRole = async (id, role) => {
  try {
    await putForm(`/api/admin/users/${id}/role`, { role });
    alert("Rol actualizado");
    await loadUsers();
  } catch (e) { alert(e.message); }
};

window.resetPass = async (id) => {
  const input = document.getElementById(`pass-${id}`);
  try {
    await putJSON(`/api/admin/users/${id}/password`, { new_password: input.value });
    alert("Password reseteado");
    input.value = "";
  } catch (e) { alert(e.message); }
};

window.deleteUser = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
  try {
    await delReq(`/api/admin/users/${id}`);
    alert("Usuario eliminado");
    await loadUsers();
  } catch (e) { alert(e.message); }
};

// TARIFAS
function renderTariffs(tariffsList) {
  const container = document.getElementById("tariffs");
  if (!Array.isArray(tariffsList) || tariffsList.length === 0) {
    container.innerHTML = "";
    tariffsMsg.textContent = "No hay tarifas configuradas.";
    tariffsMsg.className = "bad";
    return;
  }
  container.innerHTML = tariffsList.map(t => `
    <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:10px 0;">
      <h3 style="margin:0 0 8px 0;">Modo: ${t.mode.toUpperCase()}</h3>

      <label>RD$ por libra</label>
      <input id="rate-${t.mode}" type="number" step="0.01" value="${t.rate_per_lb}"/>

      <label>Divisor volumétrico</label>
      <input id="div-${t.mode}" type="number" step="0.01" value="${t.volumetric_divisor}"/>

      <button onclick="saveTariff('${t.mode}')">Guardar ${t.mode.toUpperCase()}</button>
      <small>Última actualización: ${t.updated_at || "—"}</small>
    </div>
  `).join("");
}

async function loadTariffs() {
  tariffsMsg.textContent = "Cargando tarifas...";
  tariffsMsg.className = "";
  try {
    const data = await getJSON("/api/tariffs");
    renderTariffs(data.tariffs);
    tariffsMsg.textContent = "Tarifas cargadas ✅";
    tariffsMsg.className = "good";
  } catch (e) {
    tariffsMsg.textContent = "❌ " + e.message;
    tariffsMsg.className = "bad";
  }
}

window.saveTariff = async (mode) => {
  const rate = Number(document.getElementById(`rate-${mode}`).value);
  const divisor = Number(document.getElementById(`div-${mode}`).value);
  try {
    await putJSON(`/api/admin/tariffs/${mode}`, { rate_per_lb: rate, volumetric_divisor: divisor });
    alert("Tarifa actualizada");
    await loadTariffs();
  } catch (e) { alert(e.message); }
};

const DEFAULT_TARIFFS = {
  air: { rate_per_lb: 240, volumetric_divisor: 166.0 },
  sea: { rate_per_lb: 120, volumetric_divisor: 166.0 }
};

async function resetTariffsToDefault() {
  if (!confirmReset.checked) {
    tariffsMsg.textContent = "❌ Marca la casilla de confirmación.";
    tariffsMsg.className = "bad";
    return;
  }
  try {
    await putJSON("/api/admin/tariffs/air", DEFAULT_TARIFFS.air);
    await putJSON("/api/admin/tariffs/sea", DEFAULT_TARIFFS.sea);
    tariffsMsg.textContent = "✅ Tarifas reseteadas";
    tariffsMsg.className = "good";
    confirmReset.checked = false;
    await loadTariffs();
  } catch (e) {
    tariffsMsg.textContent = "❌ " + e.message;
    tariffsMsg.className = "bad";
  }
}

btnTariffs.onclick = loadTariffs;
btnResetTariffs.onclick = resetTariffsToDefault;

// SHIPMENTS / LEADS / UPLOADS
btnShipments.onclick = async () => {
  try {
    const data = await getJSON("/api/admin/shipments");
    shipments.innerHTML = data.shipments.map(s => `
      <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin:10px 0;">
        <b>${s.tracking_number}</b> — ${s.status} — ${s.last_location || ""} (${s.provider || ""})
      </div>
    `).join("");
  } catch (e) { shipments.textContent = e.message; }
};

btnUpsertShipment.onclick = async () => {
  try {
    await putForm(`/api/admin/shipments/${trk.value}`, {
      status: trkStatus.value,
      location: trkLoc.value,
      provider: "manual"
    });
    alert("Tracking guardado");
  } catch (e) { alert(e.message); }
};

btnLeads.onclick = async () => {
  try { leads.textContent = JSON.stringify(await getJSON("/api/admin/leads"), null, 2); }
  catch (e) { leads.textContent = e.message; }
};

btnUploads.onclick = async () => {
  try { uploads.textContent = JSON.stringify(await getJSON("/api/admin/uploads"), null, 2); }
  catch (e) { uploads.textContent = e.message; }
};

loadUsers();