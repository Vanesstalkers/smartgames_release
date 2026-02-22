function zoneAvailable(zoneId) {
  return (this.getStore().player?.[this.gameState.sessionPlayerId]?.eventData.availableZones || []).includes(zoneId);
}
function hideZonesAvailability() {
  if (this.gameState.viewerMode) return;
  if (!this.getStore().player[this.gameState.sessionPlayerId].eventData) return; // это баг, но поймать пока не получается
  this.getStore().player[this.gameState.sessionPlayerId].eventData.availableZones = [];
}
function calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
  const p = {};
  const gamePlane = document.getElementById('gamePlane');
  if (gamePlane instanceof HTMLElement) {
    const gamePlaneRect = gamePlane.getBoundingClientRect();
    const planes = gamePlane.querySelectorAll('.plane, .fake-plane');
    planes.forEach((plane) => {
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
    // вычисляем центр для определения корректного transform-origin (нужен для вращения gp-content)
    this.gameCustom.gamePlaneTransformOrigin = {
      [this.gameState.gameId]: {
        x: (p.r - p.l) / (gamePlaneScale * 2) + p.ol / gamePlaneScale,
        y: (p.b - p.t) / (gamePlaneScale * 2) + p.ot / gamePlaneScale,
      },
    };

    const onePlaneMultiplier = planes.length === 1 ? 2 : 1;

    return {
      height: (onePlaneMultiplier * (p.b - p.t)) / gamePlaneScale + 'px',
      width: (onePlaneMultiplier * (p.r - p.l)) / gamePlaneScale + 'px',
      top: `calc(50% - ${(p.b - p.t) / 2 + p.ot * 1}px)`,
      left: `calc(50% - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
    };
  }
}
function hidePreviewPlanes() {
  this.gameCustom.selectedFakePlanes = {};
}
export default { zoneAvailable, hideZonesAvailability, calcGamePlaneCustomStyleData, hidePreviewPlanes };

export const gameCustomArgs = {
  pickedDiceId: '',
  selectedDiceSideId: '',
  selectedCard: '',
  selectedPlane: '',
  selectedFakePlanes: {},
  gamePlaneTranslateX: 0,
  gamePlaneTranslateY: 0,
  gamePlaneRotation: 0,
  gamePlaneTransformOrigin: {},
  viewerState: { showCards: {} },
};
