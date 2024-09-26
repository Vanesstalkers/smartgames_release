function getSuperGame() {
  return this.$root.state.store.game?.[this.gameState.gameId] || {};
}
function getSuperStore() {
  return this.getSuperGame().store || {};
}
function getStore() {
  const game = this.$root.state.store.game?.[this.gameState.gameId] || {};
  return game.store || {};
}
function playerGameId() {
  const game = this.$root.state.store.game?.[this.gameState.gameId] || {};

  if (this.gameState.viewerMode) return this.gameState.gameId;

  return Object.entries(game.gamesMap || {}).find(([gameId, players]) => players[this.gameState.sessionPlayerId])?.[0];
}
function getGame() {
  const gameId = this.playerGameId();

  if (this.gameState.viewerMode) return this.getSuperGame();

  return this.getSuperGame().store?.game[gameId] || {};
}
function gameFinished() {
  return this.getSuperGame().status === 'FINISHED';
}
function actionsDisabled() {
  return this.getGame().roundReady || this.store.player?.[this.gameState.sessionPlayerId]?.eventData?.actionsDisabled;
}
function calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
  const playerGameId = this.playerGameId();

  const p = {};
  const gamePlane = document.getElementById('gamePlane');
  if (gamePlane instanceof HTMLElement) {
    const gamePlaneRect = gamePlane.getBoundingClientRect();

    const pp = {};
    gamePlane.querySelectorAll('.gp').forEach((gp) => {
      const gameId = gp.attributes.gameid.value;
      const gp_rect = gp.getBoundingClientRect();

      // gp может будет пустой, когда все plane переместятся в superGame
      if (p.l == undefined || gp_rect.left < p.l) p.l = gp_rect.left;
      if (p.r == undefined || gp_rect.left > p.r) p.r = gp_rect.left;
      if (p.t == undefined || gp_rect.top < p.t) p.t = gp_rect.top;
      if (p.b == undefined || gp_rect.top > p.b) p.b = gp_rect.top;
      if (p.ot == undefined || gp_rect.top - gamePlaneRect.top < p.ot) p.ot = gp_rect.top - gamePlaneRect.top;
      if (p.ol == undefined || gp_rect.left - gamePlaneRect.left < p.ol) p.ol = gp_rect.left - gamePlaneRect.left;

      gp.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
        const rect = plane.getBoundingClientRect();

        // насколько plane вылез во вне gamePlane
        const offsetTop = rect.top - gamePlaneRect.top;
        const offsetLeft = rect.left - gamePlaneRect.left;

        if (gameId === playerGameId) {
          if (pp.t == undefined || rect.top < pp.t) pp.t = rect.top;
          if (pp.b == undefined || rect.bottom > pp.b) pp.b = rect.bottom;
          if (pp.l == undefined || rect.left < pp.l) pp.l = rect.left;
          if (pp.r == undefined || rect.right > pp.r) pp.r = rect.right;

          const gp_offsetTop = rect.top - gp_rect.top;
          const gp_offsetLeft = rect.left - gp_rect.left;

          if (pp.ot == undefined || gp_offsetTop < pp.ot) pp.ot = gp_offsetTop;
          if (pp.ol == undefined || gp_offsetLeft < pp.ol) pp.ol = gp_offsetLeft;
        }

        if (p.t == undefined || rect.top < p.t) p.t = rect.top;
        if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
        if (p.l == undefined || rect.left < p.l) p.l = rect.left;
        if (p.r == undefined || rect.right > p.r) p.r = rect.right;

        if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
        if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;
      });
    });

    // вычисляем центр для определения корректного transform-origin (нужен для вращения gp-content)
    const gamePlaneTransformOrigin =
      `${(pp.r - pp.l) / (gamePlaneScale * 2) + pp.ol / gamePlaneScale}px ` +
      `${(pp.b - pp.t) / (gamePlaneScale * 2) + pp.ot / gamePlaneScale}px `;

    return {
      height: (p.b - p.t) / gamePlaneScale + 'px',
      width: (p.r - p.l) / gamePlaneScale + 'px',
      top: `calc(50% - ${(p.b - p.t) / 2 + p.ot * 1}px)`,
      left: `calc(50% - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
      gamePlaneTransformOrigin,
    };
  }
}
function getGamePlaneOffsets() {
  const game = this.$root.state.store.game?.[this.gameState.gameId] || {};
  const deviceOffset = this.$root.state.isMobile ? (this.$root.state.isLandscape ? 0 : -100) : 500;

  const offsets = {
    [this.gameState.gameId]: { x: 0 + deviceOffset, y: 0 },
  };

  const gameIds = Object.keys(game.gamesMap);
  // выравниваем gamePlane, равномерно распределяя gp вокруг центра (в corporateGame.vue добавляется game с идентификатором "fake")
  if (gameIds.length % 2 === 1) gameIds.push('fake');

  for (let i = 0; i < gameIds.length; i++) {
    switch (gameIds.length) {
      case 2:
        offsets[gameIds[i]] = {
          x: [-2000, 2000][i] + deviceOffset,
          y: 0,
        };
        break;
      case 3:
        offsets[gameIds[i]] = {
          x: [-2000, 2000, 0][i] + deviceOffset,
          y: [0, 0, 2000][i],
        };
        break;
      case 4:
      default:
        offsets[gameIds[i]] = {
          x: [-2000, 2000, 0, 0][i] + deviceOffset,
          y: [0, 0, 2000, -2000][i],
        };
        break;
    }
  }

  return offsets;
}
export default {
  getSuperGame,
  getSuperStore,
  getStore,
  playerGameId,
  getGame,
  gameFinished,
  actionsDisabled,
  calcGamePlaneCustomStyleData,
  getGamePlaneOffsets,
};
