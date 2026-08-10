let rawDashboardData = [];

window.onload = async () => {
  const authDataStr = localStorage.getItem('dashboard_auth');
  if (!authDataStr) {
    window.location.href = 'index.html'; // Bounce back to master if no auth
    return;
  }
  const authData = JSON.parse(authDataStr);
  
  if (authData.status === 'admin') {
    document.getElementById('adminView').style.display = 'block';
    loadAdminData();
  } else if (authData.status === 'school') {
    document.getElementById('schoolView').style.display = 'block';
    document.getElementById('welcomeTitle').innerText = `Status Sekolah: ${authData.schoolName}`;
    loadSchoolData(authData.schoolCode, authData.schoolName);
  } else {
    window.location.href = 'index.html';
  }
};

async function loadAdminData() {
  showLoader("Memuat data pentadbir...");
  const summary = await fetchAPI('getSchoolSummary');
  hideLoader();
  
  const tbody = document.getElementById('adminSchoolBody');
  tbody.innerHTML = summary.map(s => `
    <tr>
      <td><strong>${s.nama}</strong></td>
      <td>${s.total}</td>
      <td>${s.percentTebus}%</td>
      <td>${s.percentGuna}%</td>
    </tr>
  `).join('');
}

async function loadSchoolData(code, name) {
  showLoader("Memuat data sekolah...");
  const data = await fetchAPI('getVoucherData', { schoolCode: code, schoolName: name });
  hideLoader();
  
  // Populate Metrics
  document.getElementById('valTotal').innerText = data.summary.totalStudents;
  document.getElementById('valTebus').innerText = data.summary.totalSudahTebus;
  document.getElementById('valGuna').innerText = data.summary.totalSudahGuna;
  
  // Populate Filters
  const select = document.getElementById('filterTingkatan');
  data.filters.tingkatan.forEach(t => select.innerHTML += `<option value="${t}">${t}</option>`);
  
  rawDashboardData = data.rows;
  applyFilters();
}

function applyFilters() {
  const search = document.getElementById('searchNama').value.toLowerCase();
  const tingkatan = document.getElementById('filterTingkatan').value;
  
  const filtered = rawDashboardData.filter(item => {
    let match = true;
    if (search && !item.nama.toLowerCase().includes(search)) match = false;
    if (tingkatan && item.tingkatan !== tingkatan) match = false;
    return match;
  });
  
  const tbody = document.getElementById('tableBody');
  if(!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Tiada rekod.</td></tr>';
      return;
  }
  
  tbody.innerHTML = filtered.map((row, i) => {
    const clsTebus = row.tebus.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum';
    const clsGuna = row.guna.toLowerCase().includes('sudah') ? 'badge-sudah' : 'badge-belum';
    return `
      <tr>
        <td>${i+1}</td>
        <td><strong>${row.nama}</strong></td>
        <td>${row.tingkatan}</td>
        <td><span class="badge ${clsTebus}">${row.tebus}</span></td>
        <td><span class="badge ${clsGuna}">${row.guna}</span></td>
      </tr>
    `;
  }).join('');
}