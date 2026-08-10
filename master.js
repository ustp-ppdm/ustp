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

  // Create a logout URL that redirects back to this exact GitHub page[cite: 2]
  const currentUrl = window.location.href.split('?')[0];
  const switchAccountUrl = 'https://accounts.google.com/Logout?continue=' + encodeURIComponent('https://appengine.google.com/_ah/logout?continue=' + encodeURIComponent(currentUrl));

  // If fetch failed (CORS error, not logged in, or DELIMa block)
  if (data.status === 'error' || data.error === 'Failed to fetch') {
    document.getElementById('authError').innerText = "Ralat capaian. Pastikan anda menggunakan akaun DELIMa atau klik butang di bawah.";
    document.getElementById('googleAuthAction').style.display = 'block';
    document.getElementById('forceLoginBtn').href = switchAccountUrl;
    return;
  }

  // Hide the fallback auth button on success
  document.getElementById('googleAuthAction').style.display = 'none';

  // Update Header UI with user details and assign the Switch Account link[cite: 2]
  document.getElementById('userProfile').style.display = 'flex';
  document.getElementById('userName').innerText = data.user.name;
  document.getElementById('userEmail').innerText = data.user.email || 'Akses via PIN';
  document.getElementById('switchBtn').href = switchAccountUrl;

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