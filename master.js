// GANTIKAN DENGAN WEB APP URL ANDA
const API_URL = "YOUR_WEB_APP_URL_HERE"; 

let loaderInterval;

function showLoader(msg) {
  document.getElementById('dynamicLoader').style.display = 'flex';
  document.getElementById('loaderMessage').innerText = msg;
}
function hideLoader() {
  document.getElementById('dynamicLoader').style.display = 'none';
}

async function fetchAPI(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.append('action', action);
  for (let k in params) {
    if (params[k]) url.searchParams.append(k, params[k]);
  }
  try {
    const res = await fetch(url);
    return await res.json();
  } catch(e) {
    return { status: 'error', error: e.message };
  }
}

async function verifyAccess(pin = null) {
  if(!pin) pin = document.getElementById('pinInput').value;
  
  showLoader("Menyemak akses sistem...");
  const data = await fetchAPI('checkAccess', { pin: pin });
  hideLoader();

  if (data.status === 'error') {
    document.getElementById('authError').innerText = data.error;
    return;
  }

  // Update Header
  document.getElementById('userProfile').style.display = 'flex';
  document.getElementById('userName').innerText = data.user.name;
  document.getElementById('userEmail').innerText = data.user.email || 'Akses via PIN';

  // Save auth state for modules to read
  localStorage.setItem('dashboard_auth', JSON.stringify(data));

  if (data.status === 'unauthorized') {
    document.getElementById('authError').innerText = data.error || "Akses tidak dibenarkan. Sila cuba PIN.";
  } else {
    document.getElementById('authView').style.display = 'none';
    document.getElementById('modulesView').style.display = 'block';
  }
}

window.onload = () => {
  // Auto check on load if already authenticated
  const savedAuth = localStorage.getItem('dashboard_auth');
  if (savedAuth) {
    const data = JSON.parse(savedAuth);
    if(data.status !== 'unauthorized') verifyAccess(); 
  } else {
    verifyAccess(); // Try to login via email automatically first
  }
};