const API_URL = "http://localhost:8000/api";

async function track() {
    const id = document.getElementById('trackId').value;
    const res = await fetch(`${API_URL}/track/${id}`);
    const data = await res.json();
    document.getElementById('res').innerText = `Estado: ${data.status}`;
}

async function createShipment() {
    const payload = {
        client_name: document.getElementById('cName').value,
        weight: parseFloat(document.getElementById('cWeight').value),
        mode: "air"
    };
    const res = await fetch(`${API_URL}/shipments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
    });
    if(res.ok) alert("Creado!");
}

function logout() { localStorage.removeItem('token'); window.location.href='index.html'; }