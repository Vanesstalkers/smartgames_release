(function ({ joinPort, gameId }) {
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
    const mainPlanePositions = { left: mainPlane.left, top: mainPlane.top, rotation: mainPlane.rotation };

    const linkedPlanes = [];
    for (const bridge of mainPlane.getLinkedBridges()) {
      if (usedBridges.includes(bridge)) continue;
      usedBridges.push(bridge);

      const [joinPort, targetPort] = bridge.getLinkedPorts().sort((a, b) => (a.parent() !== mainPlane ? -1 : 1));
      const joinPlane = joinPort.parent();
      if (!originalPositions[joinPlane.id()]) {
        originalPositions[joinPlane.id()] = { left: joinPlane.left, top: joinPlane.top, rotation: joinPlane.rotation };
      }

      this.run('updatePlaneCoordinates', { joinPort, targetPort });
      checkPlaneHasCollision(joinPlane);

      linkedPlanes.push(joinPlane);
      linkedPlanes.push(...checkLinkedPlanesHasCollision(joinPlane, usedBridges));
    }

    mainPlane.set(mainPlanePositions); // без этого будет некорректный расчет joinPlane.getPosition()
    return linkedPlanes;
  };

  for (const plane of this.decks.table.items()) {
    if (plane === joinPlane) continue;

    for (const port of plane.ports()) {
      if (port.linkedBridgeCode) continue; // port уже занят

      for (const portDirect of Object.keys(port.direct)) {
        const updateResult = port.updateDirect(portDirect);
        if (!updateResult) continue;

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
          position: joinPlane.getPosition(),
          joinPlaneId: joinPlane.id(),
          joinPortId: joinPort.id(),
          joinPortDirect: joinPort.getDirect(),
          targetPlaneId: plane.id(),
          targetPortId: port.id(),
          targetPortDirect: portDirect,
          linkedPlanes: linkedPlanes.map((plane) => ({
            gameId,
            joinPlaneId: plane.id(),
            position: plane.getPosition(),
          })),
          priority: Math.abs(plane.top - joinPlane.top) + Math.abs(plane.left - joinPlane.left), // чем больше общий bbox, тем (теоретически) больше свободных port-ов
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
