(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.parent();
  const targetPort = this.get(targetPortId);
  const targetPlane = targetPort.parent();
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
  joinPlane.moveToTarget(targetTable, { anchorGameId: targetPlane.anchorGameId });
});
