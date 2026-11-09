'use strict';

/**
 * Bộ điều khiển chung cho các cử chỉ con trỏ: kéo-xoay 1 ngón & pinch-zoom 2 ngón.
 * Dùng chung cho phong bì 3D (main.js) và trình xem thiệp hai mặt.
 */
function createPinchZoomController(element, options = {}) {
  const {
    dragSlop = 0,
    draggingClass = 'is-dragging',
    mouseButton = 0,
    preventDefaultOnStart = false,
    canStart = () => true,
    onStart = () => {},
    getZoom = () => 1,
    onPinch = () => {},
    onDrag = () => {},
    onSettle = () => {}
  } = options;

  const activePointers = new Map();
  let lastPointer = null;
  let dragStartPoint = null;
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let isDragging = false;
  let isPinching = false;

  const getPointerDistance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

  function beginPinch() {
    const [p1, p2] = [...activePointers.values()];
    pinchStartDistance = getPointerDistance(p1, p2);
    pinchStartZoom = getZoom();
    isPinching = true;
    if (draggingClass) element.classList.add(draggingClass);
  }

  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== mouseButton) return;
    if (!canStart(event) || activePointers.size >= 2) return;

    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    onStart(event, activePointers.size);

    if (activePointers.size === 1) {
      lastPointer = { x: event.clientX, y: event.clientY };
      dragStartPoint = { x: event.clientX, y: event.clientY };
      isDragging = false;
      isPinching = false;
    } else {
      beginPinch();
    }

    if (preventDefaultOnStart) event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!activePointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    activePointers.set(event.pointerId, point);

    // 2 ngón tay -> pinch zoom
    if (activePointers.size >= 2) {
      const [p1, p2] = [...activePointers.values()];
      if (pinchStartDistance > 0) {
        onPinch(getPointerDistance(p1, p2) / pinchStartDistance, pinchStartZoom);
      }
      return;
    }

    // 1 ngón tay -> kéo
    const deltaX = point.x - lastPointer.x;
    const deltaY = point.y - lastPointer.y;
    lastPointer = point;

    if (!isDragging) {
      const totalDelta = Math.hypot(point.x - dragStartPoint.x, point.y - dragStartPoint.y);
      if (totalDelta < dragSlop) return;
      isDragging = true;
      if (draggingClass) element.classList.add(draggingClass);
    }
    onDrag(deltaX, deltaY);
  }

  function handlePointerEnd(event) {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.delete(event.pointerId);

    if (element.hasPointerCapture && element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    if (activePointers.size === 1) {
      // Còn lại 1 ngón: cập nhật lại điểm neo của cú kéo
      lastPointer = { ...activePointers.values().next().value };
      pinchStartDistance = 0;
      isPinching = false;
    } else if (activePointers.size === 0) {
      lastPointer = null;
      dragStartPoint = null;
      pinchStartDistance = 0;
      if (draggingClass) element.classList.remove(draggingClass);
      const dragged = isDragging;
      const pinched = isPinching;
      isDragging = false;
      isPinching = false;
      onSettle({ dragged, pinched });
    }
  }

  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('pointermove', handlePointerMove);
  element.addEventListener('pointerup', handlePointerEnd);
  element.addEventListener('pointercancel', handlePointerEnd);

  return {
    activePointers,
    getPinchStartZoom: () => pinchStartZoom,
    reset() {
      activePointers.clear();
      lastPointer = null;
      dragStartPoint = null;
      pinchStartDistance = 0;
      isDragging = false;
      isPinching = false;
      if (draggingClass) element.classList.remove(draggingClass);
    }
  };
}
