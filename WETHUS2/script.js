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
  var commentBtn = document.getElementById('modalCommentBtn');
  var commentPanel = document.getElementById('modalCommentPanel');
  var commentCloseBtn = document.getElementById('modalCommentClose');
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
    if (likeBtn) likeBtn.classList.toggle('liked', !!data._liked);
    if (likeBtn) likeBtn.innerHTML = (data._liked ? '♥ ' : '♡ ') + '<span id="modalLikeCount">' + (data.likes || 0) + '</span>';
    likeCountEl = document.getElementById('modalLikeCount');
    renderComments(data.comments || []);
    if (commentPanel) commentPanel.style.display = 'none';
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
    card.addEventListener('click', function (e) {
      if (e.target.closest('.team-toggle') || e.target.closest('.member-pill')) return;
      var raw = card.getAttribute('data-project');
      try {
        openModal(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    });
  });

  document.querySelectorAll('.team-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var list = btn.nextElementSibling;
      if (!list) return;
      list.classList.toggle('open');
    });
  });


  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.getAttribute('data-close') === 'true') closeModal();
  });

  if (likeBtn) {
    likeBtn.addEventListener('click', function () {
      if (!currentProjectId || !window.WETHUS) return;
      var result = WETHUS.toggleLike(currentProjectId);
      if (!result) return;
      likeBtn.classList.toggle('liked', !!result.liked);
      likeBtn.innerHTML = (result.liked ? '♥ ' : '♡ ') + '<span id="modalLikeCount">' + result.likes + '</span>';
      likeCountEl = document.getElementById('modalLikeCount');
    });
  }

  if (commentBtn) {
    commentBtn.addEventListener('click', function () {
      if (!commentPanel) return;
      commentPanel.style.display = 'block';
      if (commentInput) commentInput.focus();
    });
  }

  if (commentCloseBtn) {
    commentCloseBtn.addEventListener('click', function () {
      if (commentPanel) commentPanel.style.display = 'none';
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

  var memberModal = document.getElementById('memberModal');
  var memberName = document.getElementById('memberName');
  var memberRole = document.getElementById('memberRole');
  var memberBio = document.getElementById('memberBio');

  function openMember(member) {
    if (!memberModal) return;
    memberName.textContent = member.name || '팀원';
    memberRole.textContent = member.role || '팀원';
    memberBio.textContent = member.bio || '소개가 아직 없습니다.';
    memberModal.classList.add('open');
    memberModal.setAttribute('aria-hidden', 'false');
  }

  function closeMember() {
    if (!memberModal) return;
    memberModal.classList.remove('open');
    memberModal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.member-pill').forEach(function (pill) {
    pill.addEventListener('click', function (e) {
      e.stopPropagation();
      var raw = pill.getAttribute('data-member');
      try { openMember(JSON.parse(raw)); } catch (_) {}
    });
  });

  document.getElementById('memberModalClose')?.addEventListener('click', closeMember);
  memberModal?.addEventListener('click', function (e) {
    if (e.target && e.target.getAttribute('data-close-member') === 'true') closeMember();
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); closeMember(); }
  });
})();
