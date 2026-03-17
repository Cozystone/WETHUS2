(function () {
  'use strict';

  document.querySelectorAll('.nav-link[href^="#"], .btn[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Project modal on home cards
  var modal = document.getElementById('projectModal');
  if (!modal) return;

  var titleEl = document.getElementById('modalTitle');
  var categoryEl = document.getElementById('modalCategory');
  var summaryEl = document.getElementById('modalSummary');
  var descEl = document.getElementById('modalDesc');
  var statusEl = document.getElementById('modalStatus');
  var rolesEl = document.getElementById('modalRoles');
  var durationEl = document.getElementById('modalDuration');

  function openModal(data) {
    titleEl.textContent = data.title || '';
    categoryEl.textContent = data.category || '';
    summaryEl.textContent = data.summary || '';
    descEl.textContent = data.desc || '';
    statusEl.textContent = data.status || '';
    rolesEl.textContent = data.roles || '';
    durationEl.textContent = data.duration || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.card').forEach(function (card) {
    var btn = card.querySelector('.card-open');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var raw = card.getAttribute('data-project');
      try {
        openModal(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    });
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.getAttribute('data-close') === 'true') closeModal();
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
