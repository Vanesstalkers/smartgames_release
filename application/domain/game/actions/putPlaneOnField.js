(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }, initPlayer) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.parent();
  const targetPort = this.get(targetPortId);
  const targetPlane = targetPort.parent();
  const joinGame = joinPort.game();
  let targetGame = targetPort.game();
  if (targetGame.merged) targetGame = targetGame.game();
  const targetTable = targetGame.decks.table;

  let targetPortIsAvailable = false;
  joinGame.disableChanges();
  {
    // возможно ранее уже был вызван showPlanePortsAvailability (ВАЖНО чтобы не было pop/unshift от availablePorts)
    let availablePorts = initPlayer?.eventData.availablePorts; // в putStartPlanes нет initPlayer
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

  initPlayer?.set({ eventData: { availablePorts: [] } });
  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);

  targetGame.run('createBridge', { joinPort, targetPort });

  joinPlane.game(targetGame);
  joinPlane.moveToTarget(targetTable, { anchorGameId: targetPlane.anchorGameId });
});
