(function ({ joinPort, gameId, playerId }) {
  const availablePorts = [];
  const joinPlane = joinPort.getParent();
  const originalPositions = {
    [joinPlane.id()]: { left: joinPlane.left, top: joinPlane.top, rotation: joinPlane.rotation },
  };

  const noCrossing = (pos1, pos2) => {
    return (
      pos1.bottom < pos2.top || //
      pos1.top > pos2.bottom ||
      pos1.right < pos2.left ||
      pos1.left > pos2.right
    );
  };
  const checkPlaneHasCollision = (checkPlane) => {
    const planePosition = checkPlane.getPosition();
    for (const plane of this.decks.table.items()) {
      if (plane === checkPlane) continue;
      if (noCrossing(planePosition, plane.getPosition())) continue;
      throw 'has_collision';
    }
  };
  const checkLinkedPlanesHasCollision = (mainPlane, usedBridges = []) => {
    const linkedPlanes = [];
    for (const bridge of mainPlane.getLinkedBridges()) {
      if (usedBridges.includes(bridge)) continue;
      usedBridges.push(bridge);

      const [joinPort, targetPort] = bridge.getLinkedPorts().sort((a, b) => (mainPlane.get(a) ? -1 : 1));
      const joinPlane = joinPort.parent();
      if (!originalPositions[joinPlane.id()]) {
        originalPositions[joinPlane.id()] = { left: joinPlane.left, top: joinPlane.top, rotation: joinPlane.rotation };
      }

      this.run('updatePlaneCoordinates', { joinPort, targetPort });
      checkPlaneHasCollision(joinPlane);

      linkedPlanes.push(joinPlane);
      linkedPlanes.push(...checkLinkedPlanesHasCollision(joinPlane, usedBridges));
    }
    return linkedPlanes;
  };

  for (const plane of this.decks.table.getAllItems()) {
    if (plane === joinPlane) continue;

    for (const port of plane.select('Port')) {
      if (port.linkedBridge) continue; // port уже занят

      for (const portDirect of Object.keys(port.direct)) {
        port.updateDirect(portDirect);
        this.run('updatePlaneCoordinates', { joinPort, targetPort: port });

        let linkedPlanes;
        try {
          checkPlaneHasCollision(joinPlane);
          linkedPlanes = checkLinkedPlanesHasCollision(joinPlane);
        } catch (err) {
          if (err === 'has_collision') continue;
          throw err;
        }

        availablePorts.push({
          gameId,
          playerId,
          position: joinPlane.getPosition(),
          joinPlaneId: joinPlane._id,
          joinPortId: joinPort._id,
          joinPortDirect: joinPort.getDirect(),
          targetPortId: port._id,
          targetPortDirect: portDirect,
          linkedPlanes: linkedPlanes.map((plane) => ({
            gameId,
            joinPlaneId: plane.id(),
            position: plane.getPosition(),
          })),
        });
      }
    }
  }

  // даже с disableChanges/enableChanges объект может быть отправлен на фронт через broadcastDataBeforeHandler (данные возьмутся из game.store)
  for (const [planeId, { left, top, rotation = 0 }] of Object.entries(originalPositions)) {
    this.get(planeId).set({ left, top, rotation });
  }

  return availablePorts;
});
