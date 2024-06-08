function zoneAvailable(zoneId) {
  return (this.getStore().player?.[this.gameState.sessionPlayerId]?.availableZones || []).includes(zoneId);
}
function hideZonesAvailability() {
  if (this.gameState.viewerMode) return;
  this.getStore().player[this.gameState.sessionPlayerId].availableZones = [];
}
function calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
  const p = {};
  const gamePlane = document.getElementById('gamePlane');
  if (gamePlane instanceof HTMLElement) {
    const gamePlaneRect = gamePlane.getBoundingClientRect();

    gamePlane.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
      const rect = plane.getBoundingClientRect();
      const offsetTop = rect.top - gamePlaneRect.top;
      const offsetLeft = rect.left - gamePlaneRect.left;

      if (p.t == undefined || rect.top < p.t) p.t = rect.top;
      if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
      if (p.l == undefined || rect.left < p.l) p.l = rect.left;
      if (p.r == undefined || rect.right > p.r) p.r = rect.right;

      if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
      if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;
    });

    const gamePlaneTransformOrigin =
      `${(p.r - p.l) / (gamePlaneScale * 2) + p.ol / gamePlaneScale}px ` +
      `${(p.b - p.t) / (gamePlaneScale * 2) + p.ot / gamePlaneScale}px `;

    return {
      height: (p.b - p.t) / gamePlaneScale + 'px',
      width: (p.r - p.l) / gamePlaneScale + 'px',
      top: `calc(50% - ${(p.b - p.t) / 2 + p.ot * 1}px)`,
      left: `calc(50% - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
      gamePlaneTransformOrigin,
    };
  }
}
export default { zoneAvailable, hideZonesAvailability, calcGamePlaneCustomStyleData };
