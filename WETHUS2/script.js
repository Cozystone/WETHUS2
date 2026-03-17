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
  var imageEl = document.getElementById('modalImage');
  var likeBtn = document.getElementById('modalLikeBtn');
  var likeCountEl = document.getElementById('modalLikeCount');
  var commentCountEl = document.getElementById('modalCommentCount');
  var commentsEl = document.getElementById('modalComments');
  var commentForm = document.getElementById('modalCommentForm');
  var commentInput = document.getElementById('modalCommentInput');
  var currentProjectId = null;

  function renderComments(comments) {
    if (!commentsEl) return;
    if (!comments || !comments.length) {
      commentsEl.innerHTML = '<p class="meta">아직 댓글이 없습니다.</p>';
      return;
    }
    commentsEl.innerHTML = comments.map(function (c) {
      return '<div class="comment-item"><strong>' + (c.author || '익명') + '</strong><p>' + (c.text || '') + '</p></div>';
    }).join('');
  }

  function openModal(data) {
    titleEl.textContent = data.title || '';
    categoryEl.textContent = data.category || '';
    summaryEl.textContent = data.summary || '';
    descEl.textContent = data.desc || '';
    statusEl.textContent = data.status || '';
    rolesEl.textContent = data.roles || '';
    durationEl.textContent = data.duration || '';
    imageEl.src = data.image || 'https://picsum.photos/seed/wethus-default/1200/700';
    imageEl.alt = (data.title || '프로젝트') + ' 이미지';
    currentProjectId = data.id || null;
    if (likeCountEl) likeCountEl.textContent = data.likes || 0;
    if (commentCountEl) commentCountEl.textContent = (data.comments || []).length;
    renderComments(data.comments || []);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.card[data-project]').forEach(function (card) {
    card.addEventListener('click', function () {
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

  if (likeBtn) {
    likeBtn.addEventListener('click', function () {
      if (!currentProjectId || !window.WETHUS) return;
      var count = WETHUS.toggleLike(currentProjectId);
      likeCountEl.textContent = count;
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!currentProjectId || !window.WETHUS) return;
      var text = (commentInput.value || '').trim();
      if (!text) return;
      var comments = WETHUS.addComment(currentProjectId, text) || [];
      commentInput.value = '';
      commentCountEl.textContent = comments.length;
      renderComments(comments);
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
