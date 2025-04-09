function getSuperGame() {
  return this.$root.state.store.game?.[this.gameState.gameId] || {};
}
function getStore() {
  const game = this.getSuperGame();
  return game.store || {};
}
function getPlayerGame() {
  const superGame = this.getSuperGame();
  const games = Object.entries(superGame.store?.game || {});
  const [gameId, game] = games.find(([gameId, game]) => game.playerMap[this.gameState.sessionPlayerId]) || [];
  return game || {};
}
function playerGameId() {
  if (this.gameState.viewerMode) return this.gameState.gameId;

  const game = this.getPlayerGame();
  return game._id;
}
function focusedGameId() {
  const selectedGameId = this.gameCustom.selectedGameId || this.getPlayerGame()._id;
  const selectedGame = this.getStore().game?.[selectedGameId] || {};
  const focusedGameId = selectedGame.merged ? this.gameState.gameId : selectedGameId;
  return focusedGameId;
}
function getGame(gameId) {
  if (!gameId) gameId = this.playerGameId();

  const superGame = this.getSuperGame();
  if (gameId === superGame._id) return superGame;

  return superGame.store?.game?.[gameId] || {};
}
function gameFinished() {
  return this.getSuperGame().status === 'FINISHED';
}
function actionsDisabled() {
  return this.getGame().roundReady || this.store.player?.[this.gameState.sessionPlayerId]?.eventData?.actionsDisabled;
}
function calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
  const p = {};
  const gamePlane = document.getElementById('gamePlane');
  if (gamePlane instanceof HTMLElement) {
    const gamePlaneRect = gamePlane.getBoundingClientRect();

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

      const pp = {};
      gp.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
        const rect = plane.getBoundingClientRect();

        // насколько plane вылез во вне gamePlane
        const offsetTop = rect.top - gamePlaneRect.top;
        const offsetLeft = rect.left - gamePlaneRect.left;

        if (p.t == undefined || rect.top < p.t) p.t = rect.top;
        if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
        if (p.l == undefined || rect.left < p.l) p.l = rect.left;
        if (p.r == undefined || rect.right > p.r) p.r = rect.right;

        if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
        if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;

        {
          if (pp.t == undefined || rect.top < pp.t) pp.t = rect.top;
          if (pp.b == undefined || rect.bottom > pp.b) pp.b = rect.bottom;
          if (pp.l == undefined || rect.left < pp.l) pp.l = rect.left;
          if (pp.r == undefined || rect.right > pp.r) pp.r = rect.right;

          const gp_offsetTop = rect.top - gp_rect.top;
          const gp_offsetLeft = rect.left - gp_rect.left;

          if (pp.ot == undefined || gp_offsetTop < pp.ot) pp.ot = gp_offsetTop;
          if (pp.ol == undefined || gp_offsetLeft < pp.ol) pp.ol = gp_offsetLeft;
        }
      });

      // вычисляем центр для определения корректного transform-origin (нужен для вращения gp-content)
      this.gameCustom.gamePlaneTransformOrigin = {
        ...this.gameCustom.gamePlaneTransformOrigin,
        [gameId]:
          `${(pp.r - pp.l) / (gamePlaneScale * 2) + pp.ol / gamePlaneScale}px ` +
          `${(pp.b - pp.t) / (gamePlaneScale * 2) + pp.ot / gamePlaneScale}px `,
      };
    });

    return {
      height: (p.b - p.t) / gamePlaneScale + 'px',
      width: (p.r - p.l) / gamePlaneScale + 'px',
      top: `calc(50% - ${(p.b - p.t) / 2 + p.ot * 1}px)`,
      left: `calc(50% - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
    };
  }
}
function getGamePlaneOffsets() {
  const superGameId = this.gameState.gameId;
  const superGame = this.$root.state.store.game?.[superGameId] || {};
  const deviceOffset = this.$root.state.isMobile ? (this.$root.state.isLandscape ? 0 : -100) : 500;

  const offsets = {
    [superGameId]: { x: 0 + deviceOffset, y: 0 },
  };

  if (
    !superGame.store // может возникнуть при restoreGame
  ) {
    return offsets;
  }

  const games = Object.entries(superGame.store.game);
  // выравниваем gamePlane, равномерно распределяя gp вокруг центра (в corporateGame.vue добавляется game с идентификатором "fake")
  if (games.length % 2 === 1) games.push(['fake', {}]);

  for (let i = 0; i < games.length; i++) {
    const [gameId, game] = games[i];
    switch (games.length) {
      case 2:
        offsets[gameId] = {
          x: [-2000, 2000][i] + deviceOffset,
          y: 0,
        };
        break;
      case 3:
        offsets[gameId] = {
          x: [-2000, 2000, 0][i] + deviceOffset,
          y: [0, 0, 2000][i],
        };
        break;
      case 4:
      default:
        offsets[gameId] = {
          x: [-2000, 2000, 0, 0][i] + deviceOffset,
          y: [0, 0, 2000, -2000][i],
        };
        break;
    }
  }

  return offsets;
}
function resetPlanePosition() {
  if (!this.gameCustom) return;

  // если this.getGamePlaneOffsets вызывать не через this, то потеряется ссылка на this.$root
  const { x, y } = this.getGamePlaneOffsets()[this.focusedGameId()] || { x: 0, y: 0 };
  this.gameCustom.gamePlaneTranslateX = -1 * x;
  this.gameCustom.gamePlaneTranslateY = -1 * y;
}

async function handleGameApi(data, { onSuccess, onError } = {}) {
  if (!onError) onError = prettyAlert;
  data.gameId = this.game._id;
  await api.action
    .call({ path: 'game.corporate.api.action', args: [data] })
    .then(onSuccess)
    .catch(onError);
}

export default {
  getSuperGame,
  getStore,
  getPlayerGame,
  playerGameId,
  focusedGameId,
  getGame,
  gameFinished,
  actionsDisabled,
  calcGamePlaneCustomStyleData,
  getGamePlaneOffsets,
  resetPlanePosition,
  handleGameApi,
};
