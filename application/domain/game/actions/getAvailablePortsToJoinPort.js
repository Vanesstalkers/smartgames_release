(function ({ joinPort }) {
  const availablePorts = [];
  const joinPlane = joinPort.getParent();
  const originalPosition = lib.utils.structuredClone(joinPlane.getPosition());

  for (const plane of this.decks.table.getAllItems()) {
    if (plane === joinPlane) continue;

    for (const port of plane.select('Port')) {
      if (port.linkedBridge) continue; // port уже занят

      for (const portDirect of Object.keys(port.direct)) {
        port.updateDirect(portDirect);
        this.run('updatePlaneCoordinates', { joinPort, targetPort: port });

        const planeHasCollysion = this.run('checkPlaneHasCollysion', { plane: joinPlane });
        if (planeHasCollysion) continue;

        availablePorts.push({
          position: joinPlane.getPosition(),
          joinPortId: joinPort._id,
          joinPortDirect: joinPort.getDirect(),
          targetPortId: port._id,
          targetPortDirect: portDirect,
        });
      }
    }
  }

  // даже с disableChanges/enableChanges объект может быть отправлен на фронт через broadcastDataBeforeHandler (данные возьмутся из game.store)
  joinPlane.set({ left: originalPosition.left, top: originalPosition.top, rotation: 0 });

  return availablePorts;
});
