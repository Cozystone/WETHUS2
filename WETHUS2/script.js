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
  var categoryBadgeEl = document.getElementById('modalCategoryBadge');
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
  var modalTeamEl = document.getElementById('modalTeam');
  var currentProjectId = null;

  function memberHref(m) {
    return 'member.html?name=' + encodeURIComponent(m?.name || '팀원') + '&role=' + encodeURIComponent(m?.role || '담당') + '&bio=' + encodeURIComponent(m?.bio || '소개가 아직 없습니다.');
  }

  function renderTeamMini(team) {
    if (!modalTeamEl) return;
    if (!team || !team.length) { modalTeamEl.innerHTML = ''; return; }
    var leader = team.find(function (m) { return m.isLeader; }) || team[0];
    var rest = team.filter(function (m) { return m !== leader; });
    modalTeamEl.innerHTML = '<a class="member-pill leader" href="'+memberHref(leader)+'"><span class="member-name">'+(leader.name||'대표')+'</span> <span class="member-role">대표</span></a>' +
      rest.slice(0,3).map(function (m) { return '<a class="member-pill" href="'+memberHref(m)+'"><span class="member-name">'+(m.name||'팀원')+'</span> <span class="member-role">'+(m.role||'')+'</span></a>'; }).join('');
  }

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

  function syncProjectStats(projectId, likes, commentsLen) {
    if (!projectId) return;
    document.querySelectorAll('[data-project]').forEach(function (card) {
      try {
        var raw = card.getAttribute('data-project');
        var data = JSON.parse(raw);
        if (data.id !== projectId) return;
        if (typeof likes === 'number') data.likes = likes;
        if (typeof commentsLen === 'number') {
          if (!Array.isArray(data.comments)) data.comments = [];
          data.comments.length = commentsLen;
        }
        card.setAttribute('data-project', JSON.stringify(data).replace(/'/g, '&#39;'));
        var social = card.querySelector('.card-social');
        if (social) {
          if (typeof likes === 'number' && social.children[0]) social.children[0].textContent = '♡ ' + likes;
          if (typeof commentsLen === 'number' && social.children[1]) social.children[1].textContent = '💬 ' + commentsLen;
        }
      } catch (_) {}
    });
  }

  function openModal(data) {
    titleEl.textContent = data.title || '';
    categoryEl.textContent = data.category || '';
    summaryEl.textContent = data.summary || '';
    descEl.textContent = data.desc || '';
    statusEl.textContent = data.status || '';
    if (categoryBadgeEl) categoryBadgeEl.textContent = data.category || '';
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
    renderTeamMini(data.teamMembers || []);
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
      syncProjectStats(currentProjectId, result.likes);
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
      syncProjectStats(currentProjectId, undefined, comments.length);
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); }
  });
})();
