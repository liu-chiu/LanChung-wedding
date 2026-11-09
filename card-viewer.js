'use strict';

// ==========================================
// CHẾ ĐỘ XEM THIỆP HAI MẶT VỚI XOAY 3D & THU PHÓNG
// ==========================================
function initCardViewer() {
  const cardViewer = $('#cardViewer');
  const cardViewerTrigger = $('#openCardViewer');
  const cardViewerStage = $('#cardViewerStage');
  const cardViewerCard = $('#cardViewerCard');
  const cardViewerFront = $('#cardViewerFront');
  const cardViewerBack = $('#cardViewerBack');
  const cardZoomLevel = $('#cardZoomLevel');
  const cardZoomOut = $('#cardZoomOut');
  const cardZoomIn = $('#cardZoomIn');
  const cardFlip = $('#cardFlip');
  const cardResetView = $('#cardResetView');
  const cardViewerClose = $('#closeCardViewer');

  if (
    !cardViewer || !cardViewerTrigger || !cardViewerStage || !cardViewerCard
    || !cardViewerFront || !cardViewerBack || !cardZoomLevel || !cardZoomOut
    || !cardZoomIn || !cardFlip || !cardResetView || !cardViewerClose
  ) return;

  const minZoom = 0.65;
  const maxZoom = 1.65;
  let rotationX = -7;
  let rotationY = -10;
  let zoom = 1;

  const clampZoom = value => Math.min(maxZoom, Math.max(minZoom, value));
  const updateCardViewer = () => {
    cardViewerCard.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${zoom})`;
    cardZoomLevel.value = `${Math.round(zoom * 100)}%`;
    cardZoomOut.disabled = zoom <= minZoom;
    cardZoomIn.disabled = zoom >= maxZoom;

    const frontFacing = Math.cos(rotationX * Math.PI / 180) * Math.cos(rotationY * Math.PI / 180) >= 0;
    const visibleFace = frontFacing ? cardViewerFront : cardViewerBack;
    visibleFace.style.backfaceVisibility = 'visible';
    visibleFace.style.webkitBackfaceVisibility = 'visible';
    cardViewerFront.style.visibility = frontFacing ? 'visible' : 'hidden';
    cardViewerBack.style.visibility = frontFacing ? 'hidden' : 'visible';
    cardViewerFront.setAttribute('aria-hidden', String(!frontFacing));
    cardViewerBack.setAttribute('aria-hidden', String(frontFacing));
    cardViewerCard.setAttribute('aria-label', frontFacing ? 'Mặt trước thiệp cưới' : 'Mặt sau thiệp cưới');
  };

  const setZoom = value => {
    zoom = clampZoom(value);
    updateCardViewer();
  };

  const resetCardViewer = () => {
    rotationX = -7;
    rotationY = -10;
    zoom = 1;
    updateCardViewer();
  };

  cardViewerTrigger.addEventListener('click', () => {
    resetCardViewer();
    cardViewer.showModal();
  });

  const heroCardWidget = $('#heroCardWidget');
  if (heroCardWidget) {
    heroCardWidget.addEventListener('click', () => {
      resetCardViewer();
      cardViewer.showModal();
    });
    heroCardWidget.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        resetCardViewer();
        cardViewer.showModal();
      }
    });
  }

  cardViewerClose.addEventListener('click', () => cardViewer.close());
  cardViewer.addEventListener('click', event => {
    if (event.target === cardViewer) cardViewer.close();
  });
  cardViewer.addEventListener('close', () => {
    cardViewerGestures.reset();
    resetCardViewer();
  });

  cardZoomOut.addEventListener('click', () => setZoom(zoom - 0.1));
  cardZoomIn.addEventListener('click', () => setZoom(zoom + 0.1));
  cardFlip.addEventListener('click', () => {
    const frontFacing = Math.cos(rotationX * Math.PI / 180) * Math.cos(rotationY * Math.PI / 180) >= 0;
    rotationX = 0;
    rotationY = frontFacing ? 180 : 0;
    updateCardViewer();
    window.__weddingHelpers.playPaperSound?.('flip');
  });
  cardResetView.addEventListener('click', resetCardViewer);

  cardViewerStage.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  }, { passive: false });

  // Kéo xoay & pinch-zoom thiệp dùng bộ điều khiển chung trong pinch-zoom.js
  const cardViewerGestures = createPinchZoomController(cardViewerStage, {
    draggingClass: '',
    preventDefaultOnStart: true,
    canStart: () => cardViewer.open,
    onStart: event => {
      cardViewerStage.setPointerCapture(event.pointerId);
      cardViewerCard.classList.add('is-dragging');
    },
    getZoom: () => zoom,
    onPinch: scale => setZoom(zoom * scale),
    onDrag: (deltaX, deltaY) => {
      const cardRect = cardViewerCard.getBoundingClientRect();
      rotationY += deltaX * 360 / cardRect.width;
      rotationX -= deltaY * 360 / cardRect.height;
      updateCardViewer();
    },
    onSettle: () => cardViewerCard.classList.remove('is-dragging')
  });

  updateCardViewer();
}

initCardViewer();
