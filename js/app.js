document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.module-btn');
  const area = document.getElementById('module-area');

  function showModule(name){
    // Untuk sekarang: tunjuk kandungan placeholder.
    area.innerHTML = `
      <h2>Modul: ${escapeHtml(name)}</h2>
      <p>Anda kini berada di modul <strong>${escapeHtml(name)}</strong>. Pautan sebenar atau kandungan modul akan disambungkan kemudian.</p>
      <div style="margin-top:12px">
        <button id="open-module" style="padding:8px 12px;border-radius:6px;border:1px solid #e6eef9;background:#0b5ed7;color:#fff;cursor:pointer">Buka Modul</button>
      </div>
    `;

    // Contoh: apabila pengguna klik "Buka Modul", kita akan redirect ke URL modul (placeholder)
    document.getElementById('open-module').addEventListener('click', () => {
      // Gantikan URL ini dengan route sebenar modul bila ada
      const url = `modules/${name.toLowerCase()}.html`;
      window.location.href = url;
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.module || btn.textContent.trim();
      showModule(name);
    });
  });

  // Simple escape to avoid injection in the placeholder UI
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
});
