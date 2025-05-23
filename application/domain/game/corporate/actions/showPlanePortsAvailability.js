(function ({ joinPlaneId, joinPortId, games = [] }, initPlayer) {
  const game = this.merged ? this.game() : this;
  const joinPlane = game.get(joinPlaneId);

  let availablePorts = game.run('domain.showPlanePortsAvailability', { joinPlaneId, joinPortId, games }, initPlayer);

  const hadAvailablePorts = availablePorts.length > 0;

  if (
    initPlayer // его не будет при создании игрового поля на старте игры 
    && (
      this.merged || // игроку запрещено добавлять блоки к чужим играм
      this.isSuperGame // сюда попадет END_ROUND и "Помочь выложить" с автоматическим выкладыванием plane
    )
  ) {
    const superGame = game;
    const superGameId = superGame.id();
    const playerGame = initPlayer.game();
    availablePorts = availablePorts.filter((placementConfig) => {
      const targetPlane = superGame.get(placementConfig.targetPlaneId);

      const isAnchorGame = targetPlane.anchorGameId === initPlayer.gameId;
      const mergeModeActivated = playerGame.merged !== true && targetPlane.game() === superGame && targetPlane.anchorGameId === superGameId;
      return isAnchorGame || mergeModeActivated;
    });
  }
  initPlayer?.set({ eventData: { availablePorts } }); // в putStartPlanes нет initPlayer

  if (hadAvailablePorts && availablePorts.length === 0) {
    game.toggleEventHandlers('NO_AVAILABLE_PORTS', { joinPlane });
  }

  return availablePorts;
});
