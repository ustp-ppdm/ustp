
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.module-btn');
  const area = document.getElementById('module-area');

  function showModule(name){
    const selected = String(name || 'guru').toLowerCase();
    const displayName = selected === 'guru' ? 'Guru' : selected.charAt(0).toUpperCase() + selected.slice(1);

    if (selected === 'guru') {
      area.innerHTML = `
        <section class="module-showcase">
          <div class="module-header">
            <div>
              <div class="section-kicker">Modul Guru</div>
              <h2 class="section-title">Pusat Operasi</h2>
            </div>
            <span class="pill pill-outline">Akses Guru</span>
          </div>

          <div class="quick-button-grid">
            <button class="module-action-button" data-action="e-baucar">
              <span class="button-icon">📘</span>
              <span>
                <span class="button-title">e-Baucar Buku</span>
                <span class="button-description">Kemaskini dan semak status baucar</span>
              </span>
            </button>
          </div>
        </section>
      `;

      area.querySelector('[data-action="e-baucar"]')?.addEventListener('click', () => {
        window.location.href = 'modules/guru.html';
      });
    } else {
      area.innerHTML = `
        <section class="module-showcase">
          <div class="module-header">
            <div>
              <div class="section-kicker">Modul ${escapeHtml(displayName)}</div>
              <h2 class="section-title">${escapeHtml(displayName)}</h2>
            </div>
            <span class="pill pill-outline">Dalam Rangka</span>
          </div>
          <div class="module-summary">
            <div class="empty-icon">🚧</div>
            <p>Modul ${escapeHtml(displayName)} sedang disediakan. <br />Sila pilih semula modul yang berkenaan.</p>
          </div>
        </section>
      `;
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.module || btn.textContent.trim();
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      showModule(name);
    });
  });

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
});
