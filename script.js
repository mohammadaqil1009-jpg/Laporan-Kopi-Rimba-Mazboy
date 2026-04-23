const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx2SaZSfgXFzuAn9ek6vC85TDjvWnFcN-gvzi4gPe_wlMbp60H5laUyutuymlTcpIym/exec";
const ADMIN_NUMBER = "6285117010280";

const MENUS = {
    kopi: [
        { label: "Americano Ice", harga: 6000 },
        { label: "Americano Double", harga: 8000 },
        { label: "Coffe Milk", harga: 7000 },
        { label: "Coffe Aren", harga: 8000 },
        { label: "Coffe Milo", harga: 10000 },
        { label: "Coffe Honey", harga: 10000 },
        { label: "Coffe Latte", harga: 10000 },
        { label: "Coffe Rimba", harga: 11000 },
        { label: "Salted Caramel", harga: 12000 },
        { label: "Vanilla Latte", harga: 12000 },
        { label: "Hazelnut Latte", harga: 12000 },
        { label: "Fresh Milk", harga: 8000 },
        { label: "Chocolate", harga: 8000 },
        { label: "Strawberry", harga: 8000 },
        { label: "Manggo", harga: 8000 },
        { label: "Thaitea", harga: 8000 },
        { label: "Taro", harga: 8000 },
        { label: "Matcha", harga: 9000 },
        { label: "Milo", harga: 9000 }
    ]
};

let cart = {};

// --- UTILITIES ---

function formatRupiahInput(input) {
    let val = input.value.replace(/[^0-9]/g, "");
    input.value = val ? "Rp " + parseInt(val).toLocaleString('id-ID') : "";
}

function cleanNumber(val) { 
    if(!val) return 0;
    return parseInt(val.toString().replace(/[^0-9]/g, "")) || 0; 
}

function updateProfileDisplay() {
    const nama = document.getElementById('p_nama').value;
    const role = document.getElementById('p_outlet').value;
    localStorage.setItem("staff_nama", nama);
    localStorage.setItem("staff_role", role);
    document.getElementById('display-name').innerText = nama || "Nama Staff";
    document.getElementById('display-role').innerText = role || "Outlet Belum Dipilih";
}

function openTab(evt, tabName) {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(tabName).classList.add("active");
    if(evt) evt.currentTarget.classList.add("active");
}

// Jam Realtime
setInterval(() => {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('id-ID') + " WIB";
    document.getElementById('p_time').value = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    document.getElementById('p_tgl').value = now.toISOString().split('T')[0];
}, 1000);

// --- LOGIKA PENJUALAN ---

function renderMenu() {
    const grid = document.getElementById("menu-grid");
    if (!grid) return;
    grid.innerHTML = "";
    MENUS.kopi.forEach(menu => {
        const qty = cart[menu.label] ? cart[menu.label].qty : 0;
        const div = document.createElement("div");
        div.className = "menu-item";
        div.innerHTML = `
            ${qty > 0 ? `<span class="qty-badge">${qty}</span>` : ""}
            <div class="menu-info" style="flex:1" onclick="addItem('${menu.label}', ${menu.harga})">
                <div style="font-weight:bold">${menu.label}</div>
                <small style="color:#666">Rp ${menu.harga.toLocaleString('id-ID')}</small>
            </div>
            <div class="menu-controls">
                <button class="btn-mini" onclick="changeQty('${menu.label}', -1)">−</button>
                <span style="font-weight:bold; min-width:20px; text-align:center">${qty}</span>
                <button class="btn-mini" onclick="addItem('${menu.label}', ${menu.harga})">+</button>
            </div>`;
        grid.appendChild(div);
    });
}

function addItem(label, harga) {
    if (!cart[label]) cart[label] = { qty: 0, harga: harga };
    cart[label].qty++;
    updateUI();
}

function changeQty(name, delta) {
    if (!cart[name]) return;
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    updateUI();
}

function calculateTotal() {
    let bruto = 0;
    let totalCup = 0;
    for (let i in cart) {
        bruto += cart[i].qty * cart[i].harga;
        totalCup += cart[i].qty;
    }
    
    const keluar = cleanNumber(document.getElementById("p_keluar_kopi").value);
    const qris = cleanNumber(document.getElementById("p_qris_kopi").value);
    
    // Setoran Tunai = Penjualan - Pengeluaran - QRIS
    const tunaiBersih = bruto - keluar - qris;

    document.getElementById("total-cup-kopi").value = totalCup + " Cup";
    document.getElementById("total-display-kopi").value = "Rp " + tunaiBersih.toLocaleString('id-ID');
}

function renderCart() {
    const list = document.getElementById("cart-list");
    list.innerHTML = "";
    let empty = true;
    for (let name in cart) {
        empty = false;
        const item = cart[name];
        const row = document.createElement("div");
        row.className = "cart-row";
        row.innerHTML = `<span><b>${name}</b> (x${item.qty})</span><span>Rp ${(item.qty*item.harga).toLocaleString('id-ID')}</span>`;
        list.appendChild(row);
    }
    if(empty) list.innerHTML = "<p style='text-align:center; color:#999;'>Keranjang masih kosong</p>";
}

function updateUI() {
    renderMenu();
    renderCart();
    calculateTotal();
    localStorage.setItem("rimba_cart", JSON.stringify(cart));
}

// --- CHECKOUT & WHATSAPP ---

async function checkout() {
    const nama = document.getElementById('p_nama').value;
    if(!nama) return alert("Absen dulu di tab Check-In!");
    if(Object.keys(cart).length === 0) return alert("Keranjang kosong!");

    let totalJual = 0;
    let totalCup = 0;
    let teks = `*LAPORAN KOPI RIMBA*\n👤 ${nama}\n📅 ${document.getElementById('p_tgl').value}\n━━━━━━━━━━━━\n`;

    for (let item in cart) {
        const sub = cart[item].qty * cart[item].harga;
        teks += `• ${item} x${cart[item].qty} = Rp ${sub.toLocaleString('id-ID')}\n`;
        totalJual += sub;
        totalCup += cart[item].qty;
    }

    const keluar = cleanNumber(document.getElementById("p_keluar_kopi").value);
    const qris = cleanNumber(document.getElementById("p_qris_kopi").value);
    const nettoTunai = totalJual - keluar - qris;

    teks += `━━━━━━━━━━━━\n`;
    teks += `🥤 Total Cup : ${totalCup}\n`;
    teks += `💰 Total Penjualan : Rp ${totalJual.toLocaleString('id-ID')}\n`;
    teks += `💸 Pengeluaran : Rp ${keluar.toLocaleString('id-ID')}\n`;
    teks += `📱 QRIS / Transfer : Rp ${qris.toLocaleString('id-ID')}\n`;
    teks += `💵 *SETORAN TUNAI : Rp ${nettoTunai.toLocaleString('id-ID')}*\n`;
    teks += `━━━━━━━━━━━━\n`;
    teks += `💳 Metode Pembayaran: ${document.getElementById('pay-method').value}`;

    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(teks)}`);
    
    // Reset
    if(confirm("Laporan sudah terkirim? Klik OK untuk mengosongkan keranjang.")) {
        cart = {};
        document.getElementById("p_keluar_kopi").value = "";
        document.getElementById("p_qris_kopi").value = "";
        updateUI();
    }
}

// --- ABSENSI ---

document.getElementById("absenForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const data = {
        nama: document.getElementById("p_nama").value,
        jabatan: document.getElementById("p_outlet").value,
        jam: document.getElementById("p_time").value,
        modal: document.getElementById("p_rupiah").value,
        tanggal: document.getElementById("p_tgl").value
    };
    
    const waPesan = `*CHECK-IN STAFF*\n👤 Nama: ${data.nama}\n🏠 Outlet: ${data.jabatan}\n🕒 Jam: ${data.jam}\n💰 Modal: ${data.modal}`;
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(waPesan)}`);
    
    alert("Check-in Berhasil!");
    openTab(null, 'tab-penjualan');
});

// --- KALKULATOR ---

let calcExpression = "";
function toggleCalc() {
    const box = document.getElementById('calc-box');
    box.style.display = (box.style.display === 'block') ? 'none' : 'block';
}
function calcInput(v) { calcExpression += v; updateCalcDisplay(); }
function calcClear() { calcExpression = ""; updateCalcDisplay(); }
function calcDel() { calcExpression = calcExpression.slice(0, -1); updateCalcDisplay(); }
function calcEqual() {
    try { calcExpression = eval(calcExpression).toString(); updateCalcDisplay(); } 
    catch { document.getElementById('calc-display').innerText = "Error"; calcExpression = ""; }
}
function updateCalcDisplay() { document.getElementById('calc-display').innerText = calcExpression || "0"; }

// --- INIT ---

window.onload = function() {
    const savedNama = localStorage.getItem("staff_nama");
    const savedRole = localStorage.getItem("staff_role");
    if (savedNama) document.getElementById('p_nama').value = savedNama;
    if (savedRole) document.getElementById('p_outlet').value = savedRole;
    
    const savedCart = localStorage.getItem("rimba_cart");
    if (savedCart) cart = JSON.parse(savedCart);
    
    updateProfileDisplay();
    updateUI();
};
// --- FUNGSI KIRIM DATA KE GOOGLE SHEETS ---
async function sendToGoogleSheet(data) {
    try {
        // Menggunakan mode 'no-cors' karena Apps Script seringkali bermasalah dengan CORS 
        // saat menerima POST sederhana, namun data tetap akan masuk.
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        console.log("Data dikirim ke Google Sheets");
        return true;
    } catch (e) {
        console.error("Gagal mengirim ke Google Sheets:", e);
        return false;
    }
}

// --- PERBAIKAN FUNGSI CHECKOUT ---
async function checkout() {
    const nama = document.getElementById('p_nama').value;
    const tgl = document.getElementById('p_tgl').value;
    const outlet = document.getElementById('p_outlet').value;

    if(!nama) return alert("Absen dulu di tab Check-In!");
    if(Object.keys(cart).length === 0) return alert("Keranjang kosong!");

    let totalJual = 0;
    let totalCup = 0;
    let teks = `*LAPORAN KOPI RIMBA*\n👤 ${nama}\n📅 ${tgl}\n🏠 ${outlet}\n━━━━━━━━━━━━\n`;

    // 1. Loop untuk hitung total & kirim data menu per baris ke GS
    for (let item in cart) {
        const sub = cart[item].qty * cart[item].harga;
        teks += `• ${item} x${cart[item].qty} = Rp ${sub.toLocaleString('id-ID')}\n`;
        totalJual += sub;
        totalCup += cart[item].qty;

        // Kirim rincian per item ke sheet "Penjualan"
        sendToGoogleSheet({
            sheet: "Penjualan",
            tanggal: tgl,
            nama: nama,
            outlet: outlet,
            menu: item,
            qty: cart[item].qty,
            subtotal: sub
        });
    }

    const keluar = cleanNumber(document.getElementById("p_keluar_kopi").value);
    const qris = cleanNumber(document.getElementById("p_qris_kopi").value);
    const nettoTunai = totalJual - keluar - qris;

    teks += `━━━━━━━━━━━━\n`;
    teks += `🥤 Total Cup : ${totalCup}\n`;
    teks += `💰 Total Penjualan : Rp ${totalJual.toLocaleString('id-ID')}\n`;
    teks += `💸 Pengeluaran : Rp ${keluar.toLocaleString('id-ID')}\n`;
    teks += `📱 QRIS / Transfer : Rp ${qris.toLocaleString('id-ID')}\n`;
    teks += `💵 *SETORAN TUNAI : Rp ${nettoTunai.toLocaleString('id-ID')}*\n`;
    teks += `━━━━━━━━━━━━\n`;
    teks += `💳 Metode Pembayaran: ${document.getElementById('pay-method').value}`;

    // 2. Kirim Ringkasan Penjualan ke sheet "Laporan_Harian"
    sendToGoogleSheet({
        sheet: "Laporan_Harian",
        tanggal: tgl,
        nama: nama,
        total_cup: totalCup,
        total_penjualan: totalJual,
        pengeluaran: keluar,
        qris: qris,
        setoran_tunai: nettoTunai,
        metode: document.getElementById('pay-method').value
    });

    // 3. Buka WhatsApp
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(teks)}`);
    
    // Reset
    if(confirm("Laporan sedang diproses ke sistem & WA. Klik OK untuk reset keranjang.")) {
        cart = {};
        document.getElementById("p_keluar_kopi").value = "";
        document.getElementById("p_qris_kopi").value = "";
        updateUI();
    }
}

// --- PERBAIKAN FUNGSI ABSENSI ---
document.getElementById("absenForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const data = {
        sheet: "Absensi", // Memberi tahu GS nama sheetnya
        nama: document.getElementById("p_nama").value,
        jabatan: document.getElementById("p_outlet").value,
        jam: document.getElementById("p_time").value,
        modal: document.getElementById("p_rupiah").value,
        tanggal: document.getElementById("p_tgl").value
    };
    
    // Kirim ke Google Sheets
    sendToGoogleSheet(data);
    
    const waPesan = `*CHECK-IN STAFF*\n👤 Nama: ${data.nama}\n🏠 Outlet: ${data.jabatan}\n🕒 Jam: ${data.jam}\n💰 Modal: ${data.modal}`;
    window.open(`https://api.whatsapp.com/send?phone=${ADMIN_NUMBER}&text=${encodeURIComponent(waPesan)}`);
    
    alert("Check-in Berhasil Terkirim!");
    openTab(null, 'tab-penjualan');
});
