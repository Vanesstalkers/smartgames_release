(function ({ joinPlaneId, joinPortId, games = [] }, initPlayer) {
  // !!! проблема с getAvailablePortsToJoinPort (неправильные joinGame и targetGame)
  // + тут в this может быть superGame (нужно для initGameFieldsMerge)

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
  // !!!! отфильтровать только out-game port-ы
  // !!!! в случае NOT_AVAILABLE_PORTS запретить удалять центральные и связанный с ним block
});
