const API = "https://script.google.com/macros/s/AKfycbzZvzzh_hcBEceEh3kQqhmO5C4ri4okjiyku01WuDksC6Tm1JQklKuoJhwS9tEXc4vQcQ/exec";

/* === ELEMEN & STATE === */
const desa = document.getElementById("desa");
const status = document.getElementById("status");
const cari = document.getElementById("cari");
const cariAlamat = document.getElementById("cariAlamat")
const tbody = document.getElementById("tbody");
const pagination = document.getElementById("pagination");
const btnTampil = document.getElementById("btnTampil");
const loadingOverlay = document.getElementById("loadingOverlay");

const modal = document.getElementById("modal");
const m_nama = document.getElementById("m_nama");
const m_alamat = document.getElementById("m_alamat");
const kegiatan = document.getElementById("kegiatan");
const sumber = document.getElementById("sumber");
const lat = document.getElementById("lat");
const lng = document.getElementById("lng");
const hasilgc = document.getElementById("hasilgc");

const state = { desa:"", status:"all", keyword:"", alamat:"", page:1, totalPage:1 };
let selected = null;

/* === LOADING === */
function showLoading(t="Memuat data..."){
  loadingOverlay.style.display="flex";
  loadingOverlay.querySelector(".loading-text").innerText=t;
}
function hideLoading(){
  loadingOverlay.style.display="none";
}

/* === INIT DESA === */
showLoading("Memuat daftar desa...");
fetch(`${API}?action=desa`)
  .then(r=>r.json())
  .then(list=>{
    list.forEach(d=>{
      const o=document.createElement("option");
      o.value=o.text=d;
      desa.appendChild(o);
    });
    hideLoading();
  });

btnTampil.onclick = ()=>{ state.page=1; loadData(); };

/* === LOAD DATA === */
function loadData(){
  if(!desa.value) return alert("Pilih desa");
  showLoading("Memuat data...");
  state.desa = desa.value;
  state.status = status.value;
  state.keyword = cari.value.trim();
  state.alamat = cariAlamat.value.trim(); // 🔥 BARU

  fetch(`${API}?action=list`
    + `&desa=${encodeURIComponent(state.desa)}`
    + `&status=${encodeURIComponent(state.status)}`
    + `&page=${state.page}`
    + `&keyword=${encodeURIComponent(state.keyword)}`
    + `&alamat=${encodeURIComponent(state.alamat)}`
    )
    .then(r=>r.json())
    .then(res=>{
      state.totalPage = Math.ceil(res.total / res.pageSize);
      render(res.data);
      renderPagination();
      hideLoading();
    });
}

/* === RENDER === */
function render(data){
  tbody.innerHTML = "";

  data.forEach(d=>{
    const sudahGC = String(d.hasilgc).trim() !== "";

    const tr = document.createElement("tr");
    tr.className = sudahGC ? "lengkap" : "kosong";

    tr.innerHTML = `
      <td>${d.nama}</td>
      <td>${d.alamat || "-"}</td>
      <td>${d.lat_gc ?? ""}</td>
      <td>${d.lng_gc ?? ""}</td>
      <td>${d.hasilgc ?? ""}</td>
      <td><button onclick='openModal(${JSON.stringify(d)})'>Update</button></td>
    `;

    tbody.appendChild(tr);
  });
}


function renderPagination(){
  pagination.innerHTML=`
    <button ${state.page==1?"disabled":""} onclick="changePage(${state.page-1})">Prev</button>
    <span>${state.page}/${state.totalPage}</span>
    <button ${state.page==state.totalPage?"disabled":""} onclick="changePage(${state.page+1})">Next</button>`;
}

function changePage(p){ state.page=p; loadData(); }

/* === MODAL & GPS === */
function openModal(d){
  selected=d;
  m_nama.innerText=d.nama;
  m_alamat.innerText=d.alamat||"";
  kegiatan.value=d.kegiatan||"-";
  sumber.value=d.sumber||"-";
  lat.value=d.lat_gc||"";
  lng.value=d.lng_gc||"";
  hasilgc.value=d.hasilgc||"";
  modal.style.display="block";
}
function tutup(){ modal.style.display="none"; }

function lihatLokasi(){
  if(!lat.value||!lng.value) return alert("Koordinat kosong");
  window.open(`https://www.google.com/maps?q=${lat.value},${lng.value}`);
}

function ambilLokasi(){
  showLoading("Mengambil GPS...");
  navigator.geolocation.getCurrentPosition(p=>{
    lat.value=p.coords.latitude.toFixed(6);
    lng.value=p.coords.longitude.toFixed(6);
    hideLoading();
  },()=>{ hideLoading(); alert("GPS gagal"); });
}

function simpan() {
  if (!hasilgc.value) {
    alert("Pilih hasil GC terlebih dahulu");
    return;
  }

  if (!lat.value || !lng.value) {
    alert("Koordinat belum lengkap");
    return;
  }

  showLoading("Menyimpan data...");

  const payload = new URLSearchParams({
    action: "update",
    idsbr: selected.idsbr,
    lat: lat.value,
    lng: lng.value,
    hasilgc: hasilgc.value
  });

  fetch(API, {
    method: "POST",
    body: payload
  })
    .then(r => r.json())
    .then(res => {
      hideLoading();

      if (res === "OK" || res.success) {
        tutup();
        loadData();
      } else {
        alert("Gagal menyimpan");
        console.error(res);
      }
    })
    .catch(err => {
      hideLoading();
      alert("Gagal koneksi ke server");
      console.error(err);
    });
}
