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
  return (
    this.getGame().roundReady ||
    this.store.player?.[this.gameState.sessionPlayerId]?.eventData?.actionsDisabled ||
    this.getSuperGame().status === 'RESTORING_GAME'
  );
}
function calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
  const p = {};
  const gamePlane = document.getElementById('gamePlane');
  if (gamePlane instanceof HTMLElement) {
    const gamePlaneRect = gamePlane.getBoundingClientRect();
    const gamePlaneRectTop = Math.floor(gamePlaneRect.top);
    const gamePlaneRectLeft = Math.floor(gamePlaneRect.left);

    gamePlane.querySelectorAll('.gp').forEach((gp) => {
      const gameId = gp.attributes.gameid.value;
      const gp_rect = gp.getBoundingClientRect();
      const gp_rectTop = Math.round(gp_rect.top);
      const gp_rectLeft = Math.round(gp_rect.left);

      // gp может будет пустой, когда все plane переместятся в superGame
      if (p.l == undefined || gp_rectLeft < p.l) p.l = gp_rectLeft;
      if (p.r == undefined || gp_rectLeft > p.r) p.r = gp_rectLeft;
      if (p.t == undefined || gp_rectTop < p.t) p.t = gp_rectTop;
      if (p.b == undefined || gp_rectTop > p.b) p.b = gp_rectTop;
      if (p.ot == undefined || gp_rectTop - gamePlaneRectTop < p.ot) p.ot = gp_rectTop - gamePlaneRectTop;
      if (p.ol == undefined || gp_rectLeft - gamePlaneRectLeft < p.ol) p.ol = gp_rectLeft - gamePlaneRectLeft;

      const pp = {};
      gp.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
        const rect = plane.getBoundingClientRect();
        const rectTop = Math.floor(rect.top);
        const rectBottom = Math.floor(rect.bottom);
        const rectLeft = Math.floor(rect.left);
        const rectRight = Math.floor(rect.right);
        // насколько plane вылез во вне gamePlane
        const offsetTop = rectTop - gamePlaneRectTop;
        const offsetLeft = rectLeft - gamePlaneRectLeft;

        if (p.t == undefined || rectTop < p.t) p.t = rectTop;
        if (p.b == undefined || rectBottom > p.b) p.b = rectBottom;
        if (p.l == undefined || rectLeft < p.l) p.l = rectLeft;
        if (p.r == undefined || rectRight > p.r) p.r = rectRight;

        if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
        if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;

        {
          if (pp.t == undefined || rectTop < pp.t) pp.t = rectTop;
          if (pp.b == undefined || rectBottom > pp.b) pp.b = rectBottom;
          if (pp.l == undefined || rectLeft < pp.l) pp.l = rectLeft;
          if (pp.r == undefined || rectRight > pp.r) pp.r = rectRight;

          const gp_offsetTop = rectTop - gp_rectTop;
          const gp_offsetLeft = rectLeft - gp_rectLeft;

          if (pp.ot == undefined || gp_offsetTop < pp.ot) pp.ot = gp_offsetTop;
          if (pp.ol == undefined || gp_offsetLeft < pp.ol) pp.ol = gp_offsetLeft;
        }
      });

      if (this.focusedGameId() == gameId) {
        // вычисляем центр для определения корректного transform-origin (нужен для вращения gp-content)
        this.gameCustom.gamePlaneTransformOrigin = {
          ...this.gameCustom.gamePlaneTransformOrigin,
          [gameId]: {
            x: Math.floor((pp.r - pp.l) / (gamePlaneScale * 2)) + Math.floor(pp.ol / gamePlaneScale),
            y: Math.floor((pp.b - pp.t) / (gamePlaneScale * 2)) + Math.floor(pp.ot / gamePlaneScale),
          },
        };
      }
    });
    const offsetTop = Math.floor((p.b - p.t) / 2 + p.ot * 1);
    const offsetLeft = Math.floor((p.r - p.l) / 2 + p.ol * 1);
    return {
      height: Math.floor((p.b - p.t) / gamePlaneScale) + 'px',
      width: Math.floor((p.r - p.l) / gamePlaneScale) + 'px',
      top: `calc(50% - ${offsetTop}px)`,
      left: `calc(50% - ${offsetLeft}px)`,
      'transform-origin': `${offsetLeft}px ${offsetTop}px`,
    };
  }
}
function getGamePlaneOffsets() {
  const superGameId = this.gameState.gameId;
  const superGame = this.$root.state.store.game?.[superGameId] || {};
  const deviceOffset = this.$root.state.isMobile ? (this.$root.state.isLandscape ? 0 : -100) : 1000;

  const offsets = {
    [superGameId]: { x: 0 + deviceOffset, y: 0 },
  };

  if (
    !superGame.store // может возникнуть при restoreForced
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

function logItems() {
  const items = Object.entries(this.getSuperGame().logs || {})
    .map(([id, item]) => {
      item.msg = item.msg
        .replace(/<team\s*([^>]*)>([\S\s]+?)<\/team>/g, '<a $1>$2</a>')
        .replace(/<player\s*([^>]*)>([\S\s]+?)<\/player>/g, '<a $1>$2</a>');
      return [id, item];
    })
    .reverse();
  return items || [];
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
  logItems,
};
