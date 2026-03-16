// handles dark/light toggle across pages

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    setToggleIcons('<i class="fa-solid fa-moon"></i>');
  } else {
    document.body.classList.remove('dark');
    setToggleIcons('<i class="fa-solid fa-sun"></i>');
  }
  localStorage.setItem('theme', theme);
}

function setToggleIcons(icon) {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.innerHTML = icon;
  });
}

function initializeTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();

  document.addEventListener('click', (e) => {
    // allow clicks on child elements (font-awesome icon) to toggle
    const toggleBtn = e.target.closest && e.target.closest('#themeToggle');
    if (toggleBtn) {
      const current = document.body.classList.contains('dark') ? 'dark' : 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    }
  });
});

// Safari/Firefox might restore page from bfcache without firing DOMContentLoaded
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    initializeTheme();
  }
});

