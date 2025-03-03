(function ({ joinPlaneId, joinPortId, games = [] }, initPlayer) {
  const game = this.merged ? this.game() : this;

  game.run('domain.showPlanePortsAvailability', { joinPlaneId, joinPortId }, initPlayer);

  let availablePorts = game.availablePorts;
  if (this.merged) {
    const superGame = game;
    const playerGameId = initPlayer.game().id();
    availablePorts = game.availablePorts.filter((placementConfig) => {
      const targetPlane = superGame.get(placementConfig.targetPlaneId);
      return targetPlane.sourceGameId === playerGameId;
    });
  }
  game.set({ availablePorts });
});
