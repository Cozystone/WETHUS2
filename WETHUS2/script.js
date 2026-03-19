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
  var dateRangeEl = document.getElementById('modalDateRange');
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
  var bookmarkBtn = document.getElementById('modalBookmarkBtn');
  var applyBtn = document.getElementById('modalApplyBtn');
  var commentPanel = document.getElementById('modalCommentPanel');
  var commentCloseBtn = document.getElementById('modalCommentClose');
  var commentsEl = document.getElementById('modalComments');
  var commentForm = document.getElementById('modalCommentForm');
  var commentInput = document.getElementById('modalCommentInput');
  var modalTeamEl = document.getElementById('modalTeam');
  var applyModal = document.getElementById('applyModal');
  var applyMotivation = document.getElementById('applyMotivation');
  var applySubmit = document.getElementById('applySubmit');
  var applyClose = document.getElementById('applyClose');
  var currentProjectId = null;

  function memberHref(m) {
    return 'member.html?name=' + encodeURIComponent(m?.name || '팀원') + '&role=' + encodeURIComponent(m?.role || '담당') + '&bio=' + encodeURIComponent(m?.bio || '소개가 아직 없습니다.') + '&founder=' + (m?.isLeader ? '1' : '0');
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

  function formatDateDot(v) {
    return String(v || '').replaceAll('-', '.');
  }

  function renderDateRange(data) {
    if (!dateRangeEl) return;
    if (!data || !data.startDate) {
      dateRangeEl.textContent = '';
      return;
    }
    var text = formatDateDot(data.startDate) + '~' + (data.ongoingNow ? '현재' : formatDateDot(data.endDate || ''));
    dateRangeEl.textContent = text;
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
    renderDateRange(data);
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
    if (applyBtn) {
      var applied = window.WETHUS && WETHUS.hasApplied(data.id);
      applyBtn.classList.toggle('applied', !!applied);
      applyBtn.textContent = applied ? '지원완료' : '지원하기';
    }
    if (bookmarkBtn && window.WETHUS) {
      var marked = WETHUS.isBookmarked(data.id);
      bookmarkBtn.textContent = marked ? '북마크됨' : '북마크';
    }
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

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', function () {
      if (!currentProjectId || !window.WETHUS) return;
      try {
        var result = WETHUS.toggleBookmark(currentProjectId);
        bookmarkBtn.textContent = result && result.bookmarked ? '북마크됨' : '북마크';
        var cardBtn = document.querySelector('.bookmark-btn[data-bm="' + currentProjectId + '"]');
        if (cardBtn) cardBtn.classList.toggle('active', !!(result && result.bookmarked));
      } catch (_) {}
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', async function () {
      if (!currentProjectId || !window.WETHUS) return;
      if (WETHUS.hasApplied(currentProjectId)) {
        var okCancel = await WETHUS.uiConfirm('지원을 취소하겠습니까?', { title: '지원 취소' });
        if (!okCancel) return;
        WETHUS.cancelApplication(currentProjectId);
        applyBtn.classList.remove('applied');
        applyBtn.textContent = '지원하기';
        document.querySelectorAll('.apply-btn[data-apply="' + currentProjectId + '"]').forEach(function (b) {
          b.classList.remove('applied');
          b.textContent = '지원하기';
        });
        return;
      }
      if (!applyModal) return;
      applyModal.classList.add('open');
      applyModal.setAttribute('aria-hidden', 'false');
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

  if (applySubmit) {
    applySubmit.addEventListener('click', async function () {
      if (!currentProjectId || !window.WETHUS) return;
      var motivation = (applyMotivation && applyMotivation.value || '').trim();
      if (!motivation) { await WETHUS.uiAlert('지원동기를 입력해주세요.', { title: '입력 필요' }); return; }
      var okApply = await WETHUS.uiConfirm('지원하시겠습니까?', { title: '프로젝트 지원' });
      if (!okApply) return;
      WETHUS.applyToProject(currentProjectId, motivation);
      if (applyBtn) {
        applyBtn.classList.add('applied');
        applyBtn.textContent = '지원완료';
      }
      document.querySelectorAll('.apply-btn[data-apply="' + currentProjectId + '"]').forEach(function (b) {
        b.classList.add('applied');
        b.textContent = '지원완료';
      });
      if (applyMotivation) applyMotivation.value = '';
      if (applyModal) {
        applyModal.classList.remove('open');
        applyModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (applyClose) {
    applyClose.addEventListener('click', function () {
      if (!applyModal) return;
      applyModal.classList.remove('open');
      applyModal.setAttribute('aria-hidden', 'true');
    });
  }
  if (applyModal) {
    applyModal.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute('data-close-apply') === 'true') {
        applyModal.classList.remove('open');
        applyModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); }
  });
})();
