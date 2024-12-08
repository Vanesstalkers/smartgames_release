(function ({ joinPlaneId, joinPortId, games = [] }, initPlayer) {
  if (joinPortId) joinPlaneId = this.get(joinPortId).parent().id();

  const availablePorts = [];
  const joinPlane = this.get(joinPlaneId);
  const playerId = initPlayer ? initPlayer.id() : undefined;

  if (games.length === 0) games = [this];

  for (const game of games) {
    const gameId = game.id();
    game.disableChanges();
    {
      const joinPorts = joinPlane.ports();
      for (const port of joinPorts) {
        if (joinPortId && port.id() !== joinPortId) continue;
        if (port.linkedBridgeCode) continue;

        const realDirect = port.getDirect();
        for (const direct of Object.keys(port.direct)) {
          const updateResult = port.updateDirect(direct);
          if (!updateResult) continue;
          
          const ports = game.run('getAvailablePortsToJoinPort', { joinPort: port, gameId, playerId });
          availablePorts.push(...ports);
        }
        port.updateDirect(realDirect);
      }
    }
    game.enableChanges();

    // заменить на clientCustomUpdates не получится, в частности, из-за сложной логики с card-plane (например, при авторозыгрыше "req_*"-карты в начале игры)
    game.set({ availablePorts });

    if (availablePorts.length === 0) {
      game.toggleEventHandlers('NO_AVAILABLE_PORTS', { joinPlane });
    }
  }
});
