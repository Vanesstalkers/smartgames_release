(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = this.get(targetPortId);
  const joinGame = joinPort.game();
  const targetGame = targetPort.game();
  const targetTable = targetGame.decks.table;

  let targetPortIsAvailable = false;
  joinGame.disableChanges();
  {
    let availablePorts = targetGame.availablePorts; // возможно ранее уже был вызван showPlanePortsAvailability (ВАЖНО чтобы не было pop/unshift от availablePorts)
    if (!availablePorts?.length) {
      // вызов с клиента
      joinPort.updateDirect(joinPortDirect);
      availablePorts = targetGame.run('getAvailablePortsToJoinPort', { joinPort });
    }

    targetPortIsAvailable =
      availablePorts.find(
        (item) =>
          item.joinPortId === joinPortId &&
          item.targetPortId === targetPortId &&
          item.joinPortDirect === joinPortDirect &&
          item.targetPortDirect === targetPortDirect
      ) !== undefined
        ? true
        : false;
  }
  joinGame.enableChanges();
  if (!targetPortIsAvailable) throw new Error('Блок игрового поля не может быть добавлен к этой зоне интеграции');

  targetGame.set({ availablePorts: [] });

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);

  const bridge = targetGame.run('createBridge', { joinPort, targetPort });

  joinPlane.game(targetGame);
  joinPlane.moveToTarget(targetTable);

  // переносим все связанные plane-ы
  const processedBridges = [bridge];
  const processBridges = (plane) => {
    const bridges = plane.getLinkedBridges().filter((bridge) => !processedBridges.includes(bridge));
    for (const bridge of bridges) {
      const ports = bridge.getLinkedPorts();
      const [joinPort, targetPort] = ports.sort((a, b) => (a.parent() !== plane ? -1 : 1));
      const joinPlane = joinPort.parent();
      const targetPlane = targetPort.parent();
      const targetGame = targetPlane.game();

      const { targetLinkPoint } = this.run('updatePlaneCoordinates', { joinPort, targetPort });

      joinPlane.game(targetGame);
      joinPlane.moveToTarget(targetTable);

      bridge.updateParent(targetGame);
      bridge.set({ left: targetLinkPoint.left, top: targetLinkPoint.top });
      bridge.updateRotation();

      processedBridges.push(bridge);
      processBridges(joinPlane);
    }
  };
  processBridges(joinPlane);

  return { bridge };
});
