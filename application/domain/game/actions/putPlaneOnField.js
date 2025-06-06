(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }, initPlayer) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.parent();
  const targetPort = this.get(targetPortId);

  let targetPortIsAvailable = false;
  this.disableChanges();
  {
    // возможно ранее уже был вызван showPlanePortsAvailability (ВАЖНО чтобы не было pop/unshift от availablePorts)
    let availablePorts = initPlayer?.eventData.availablePorts; // в putStartPlanes нет initPlayer
    if (!availablePorts?.length) {
      // вызов с клиента
      joinPort.updateDirect(joinPortDirect);
      availablePorts = this.run('getAvailablePortsToJoinPort', { joinPort });
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
  this.enableChanges();
  if (!targetPortIsAvailable) throw new Error('Блок игрового поля не может быть добавлен к этой зоне интеграции');

  initPlayer?.set({ eventData: { availablePorts: [] } });
  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);

  this.run('createBridge', { joinPort, targetPort });

  const moveResult = joinPlane.moveToTarget(this.decks.table);
  if (moveResult?.error) throw new Error(moveResult.error);
});
