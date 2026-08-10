const API_URL = "https://script.google.com/macros/s/AKfycbz0AeCOeAGANDgkMfHSutxqlnVa8MLRCzQMIkAAVJXl8ZG2aqAEATzTC-WNWo5G2X5U9g/exec";

async function callApi(action, params = {}) {
  const queryParams = new URLSearchParams({ action, ...params }).toString();
  try {
    const response = await fetch(`${API_URL}?${queryParams}`);
    if (!response.ok) throw new Error("Gagal berhubung dengan pelayan.");
    return await response.json();
  } catch (error) {
    throw new Error(error.message || "Ralat rangkaian.");
  }
}
