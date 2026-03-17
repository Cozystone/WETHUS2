(function () {
  'use strict';

  // Smooth anchor scroll
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

  // MVP founder form demo handling (no backend yet)
  var form = document.getElementById('applicationForm');
  var msg = document.getElementById('formMessage');
  if (form && msg) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var title = data.get('title');
      msg.textContent = '신청서가 임시 저장되었습니다: ' + title + ' (MVP 데모)';
      form.reset();
    });
  }
})();
