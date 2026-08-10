let globalUser = null;
let rawDashboardData = [];
let rawPublicSummary = [];
let rawAdminSummary = [];
let loaderInterval;
let currentUserStatus = 'unauthorized';

const PAGE_SIZE = 40;
let currentFilteredData = [];
let currentPage = 1;

const sortState = {
  public: { key: null, asc: true },
  admin: { key: null, asc: true },
  murid: { key: null, asc: true }
};

window.onload = function() {
  checkUserAccess();
};

function showLoader(message) {
  document.getElementById('dynamicLoader').style.display = 'flex';
  let dots = 0;
  clearInterval(loaderInterval);
  loaderInterval = setInterval(() => {
    dots = (dots + 1) % 4;
    document.getElementById('loaderMessage').innerText = message + ".".repeat(dots);
  }, 400);
}

function hideLoader() {
  clearInterval(loaderInterval);
  document.getElementById('dynamicLoader').style.display = 'none';
}

async function checkUserAccess(pin = null) {
  document.getElementById('errorView').style.display = 'none';
  showLoader(pin ? "Mengesahkan PIN anda" : "Menyemak akses pengguna");

  try {
    const res = await callApi('checkAccess', { pin: pin || '' });
    handleAccessResponse(res);
  } catch (err) {
    showError(err);
  }
}

function handleAccessResponse(res) {
  if (res.status === 'error') return showError(res.error);

  globalUser = res.user;
  currentUserStatus = res.status;

  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userProfile = document.getElementById('userProfile');
  const pinError = document.getElementById('pinError');

  if (userName && globalUser?.name) userName.innerText = globalUser.name;
  if (userEmail && globalUser?.email) userEmail.innerText = globalUser.email;
  if (userProfile) userProfile.style.display = 'flex';
  if (pinError) pinError.innerText = '';

  if (res.status === 'unauthorized') {
    document.getElementById('landingView').style.display = 'block';
    document.getElementById('schoolMetrics').style.display = 'none';
    const pinInput = document.getElementById('pinInput');
    if (pinInput) pinInput.style.display = 'inline-block';
    document.getElementById('publicSchoolContainer').style.display = 'block';
    if (res.error) {
      if (pinError) pinError.innerText = res.error;
      hideLoader();
    } else {
      loadPublicSummary();
    }
  } else if (res.status === 'admin') {
    document.getElementById('landingView').style.display = 'none';
    document.getElementById('adminView').style.display = 'block';
    document.getElementById('cfgVoucher').value = res.config.VOUCHER_ID;
    document.getElementById('cfgGpm').value = res.config.GPM_ID;
    document.getElementById('cfgPin').value = res.config.PIN_ID;
    loadAdminSummary();
  } else if (res.status === 'school') {
    document.getElementById('landingView').style.display = 'block';
    const pinInput = document.getElementById('pinInput');
    if (pinInput) pinInput.style.display = 'none';
    const btnMaklumat = document.getElementById('btnMaklumat');
    if (btnMaklumat) btnMaklumat.style.display = 'none';
    document.getElementById('publicSchoolContainer').style.display = 'none';
    const welcomeTitle = document.getElementById('welcomeTitle');
    if (welcomeTitle) welcomeTitle.innerText = `Status e-Baucar Buku: ${res.schoolName}`;
    loadSchoolDashboard(res.schoolCode, res.schoolName);
    document.getElementById('detailsView').style.display = 'block';
  }
}

async function loadPublicSummary() {
  showLoader("Memuat status keseluruhan sekolah...");
  try {
    rawPublicSummary = await callApi('getSchoolSummary');
    hideLoader();
    renderPublicSummary(rawPublicSummary);
  } catch (err) {
    showError(err);
  }
}

function percentBarCell(value, tone) {
  const v = parseFloat(value) || 0;
  return `<div class="cell-percent"><div class="mini-bar ${tone}"><span style="width:${v}%"></span></div><b>${value}%</b></div>`;
}

function renderPublicSummary(data) {
  const tbody = document.getElementById('publicSchoolBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="4">Tiada data sekolah dijumpai.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${s.nama}</strong></td>
      <td>${s.total}</td>
      <td>${percentBarCell(s.percentTebus, 'gold')}</td>
      <td>${percentBarCell(s.percentGuna, 'teal')}</td>
    </tr>
  `).join('');
}

async function loadSchoolDashboard(code, name) {
  showLoader("Memuat turun data sekolah");
  try {
    const res = await callApi('getVoucherData', { schoolCode: code, schoolName: name });
    hideLoader();
    renderSchoolMetrics(res.summary);
    renderDashboard(res);
    document.getElementById('schoolMetrics').style.display = 'grid';
  } catch (err) {
    showError(err);
  }
}

function renderSchoolMetrics(summary) {
  document.getElementById('valTotal').innerText = summary.totalStudents;
  document.getElementById('valTebus').innerText = summary.totalSudahTebus;
  document.getElementById('subTebus').innerText = summary.percentTebus + "% dari keseluruhan";
  document.getElementById('valGuna').innerText = summary.totalSudahGuna;
  document.getElementById('subGuna').innerText = summary.percentGuna + "% dari keseluruhan";
  document.getElementById('barTebus').querySelector('span').style.width = summary.percentTebus + '%';
  document.getElementById('barGuna').querySelector('span').style.width = summary.percentGuna + '%';
}

function renderDashboard(data) {
  rawDashboardData = data.rows;
  const tingkatanSelect = document.getElementById('filterTingkatan');
  tingkatanSelect.innerHTML = '<option value="">Semua Tingkatan</option>';
  data.filters.tingkatan.forEach(t => {
    tingkatanSelect.innerHTML += `<option value="${t}">${t}</option>`;
  });
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('searchNama').value.toLowerCase();
  const tingkatan = document.getElementById('filterTingkatan').value;
  const isBelumTebus = document.getElementById('chkBelumTebus').checked;
  const isBelumGuna = document.getElementById('chkBelumGuna').checked;

  currentFilteredData = rawDashboardData.filter(item => {
    const statusBelumTebus = !item.tebus.toLowerCase().includes('sudah');
    const statusBelumGuna = !item.guna.toLowerCase().includes('sudah');

    if (search && !item.nama.toLowerCase().includes(search)) return false;
    if (tingkatan && item.tingkatan !== tingkatan) return false;
    if (isBelumTebus && !statusBelumTebus) return false;
    if (isBelumGuna && !statusBelumGuna) return false;

    return true;
  });

  currentPage = 1;
  renderTablePage();
}

function renderTablePage() {
  const tbody = document.getElementById('tableBody');
  const total = currentFilteredData.length;

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Tiada data dijumpai.</td></tr>';
    document.getElementById('paginationInfo').innerText = '0 murid';
    return;
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = currentFilteredData.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageItems.map((row, i) => {
    const clsTebus = row.tebus.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum';
    const clsGuna = row.guna.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum';

    return `
      <tr>
        <td>${start + i + 1}</td>
        <td><strong>${row.nama}</strong></td>
        <td>${row.tingkatan}</td>
        <td><span class="badge ${clsTebus}">${row.tebus}</span></td>
        <td><span class="badge ${clsGuna}">${row.guna}</span></td>
      </tr>
    `;
  }).join('');

  document.getElementById('paginationInfo').innerText = `Memaparkan ${start + 1}-${Math.min(start + PAGE_SIZE, total)} daripada ${total} murid`;
  document.getElementById('paginationPage').innerText = `Muka ${currentPage} / ${pages}`;
}

function handleMaklumatTerperinci() {
  if (currentUserStatus === 'unauthorized') {
    const pin = document.getElementById('pinInput').value;
    if (!pin) {
      document.getElementById('pinError').innerText = 'Sila masukkan PIN.';
      return;
    }
    checkUserAccess(pin);
  }
}

async function loadAdminSummary() {
  showLoader("Memuat senarai sekolah...");
  try {
    rawAdminSummary = await callApi('getSchoolSummary');
    hideLoader();
    renderAdminSummary(rawAdminSummary);
  } catch (err) {
    showError(err);
  }
}

function renderAdminSummary(data) {
  const tbody = document.getElementById('adminSchoolTableBody');
  tbody.innerHTML = data.map(s => `
    <tr style="cursor:pointer" onclick="viewAdminSchoolDetails('${s.kod}', '${s.nama}')">
      <td><strong>${s.nama}</strong></td>
      <td>${s.total}</td>
      <td>${percentBarCell(s.percentTebus, 'gold')}</td>
      <td>${percentBarCell(s.percentGuna, 'teal')}</td>
    </tr>
  `).join('');
}

async function viewAdminSchoolDetails(code, name) {
  document.getElementById('adminSchoolDetailsContainer').style.display = 'block';
  document.getElementById('adminSchoolTitle').innerText = `Perincian: ${name} (${code})`;
  showLoader("Memuat butiran sekolah...");

  try {
    const res = await callApi('getVoucherData', { schoolCode: code, schoolName: name });
    hideLoader();
    const injection = document.getElementById('adminDetailsInjection');
    injection.innerHTML = `
      <div class="panel" style="padding:0; overflow:hidden;">
        <div class="table-scroll">
          <table>
            <thead><tr><th>Nama Murid</th><th>Tingkatan</th><th>Status Tebus</th><th>Status Guna</th></tr></thead>
            <tbody>${res.rows.map(r => `
              <tr>
                <td>${r.nama}</td>
                <td>${r.tingkatan}</td>
                <td><span class="badge ${r.tebus.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum'}">${r.tebus}</span></td>
                <td><span class="badge ${r.guna.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum'}">${r.guna}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  } catch (err) {
    showError(err);
  }
}

async function saveAdminConfigs() {
  showLoader("Menyimpan tetapan ID");
  try {
    const msg = await callApi('saveAdminSettings', {
      voucherId: document.getElementById('cfgVoucher').value.trim(),
      gpmId: document.getElementById('cfgGpm').value.trim(),
      pinId: document.getElementById('cfgPin').value.trim()
    });
    hideLoader();
    document.getElementById('adminMsg').innerText = msg;
  } catch (err) {
    showError(err);
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

function showError(err) {
  hideLoader();
  document.getElementById('errorView').style.display = 'block';
  document.getElementById('errorMsg').innerText = err.message || err;
}