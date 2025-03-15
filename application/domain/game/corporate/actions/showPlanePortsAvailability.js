(function ({ joinPlaneId, joinPortId, games = [] }, initPlayer) {
  const game = this.merged ? this.game() : this;
  const joinPlane = game.get(joinPlaneId);

  game.run('domain.showPlanePortsAvailability', { joinPlaneId, joinPortId, games }, initPlayer);

  let availablePorts = game.availablePorts;
  const hadAvailablePorts = availablePorts.length > 0;

  if (
    this.merged || // игроку запрещено добавлять блоки к чужим играм
    this.isSuperGame // сюда попадет END_ROUND с автоматическим выкладыванием plane
  ) {
    const superGame = game;
    const playerGame = initPlayer.game();
    availablePorts = game.availablePorts.filter((placementConfig) => {
      const targetPlane = superGame.get(placementConfig.targetPlaneId);

      const isAnchorGame = targetPlane.anchorGameId === initPlayer.gameId;
      const mergeModeActivated = playerGame.merged !== true && targetPlane.game() === superGame;
      return isAnchorGame || mergeModeActivated;
    });
  }
  game.set({ availablePorts });

  if (hadAvailablePorts && availablePorts.length === 0) {
    game.toggleEventHandlers('NO_AVAILABLE_PORTS', { joinPlane });
  }
});
