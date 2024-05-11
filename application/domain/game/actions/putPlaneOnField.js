(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.getParent();
  const targetPort = this.get(targetPortId);

  let targetPortIsAvailable = false;
  this.disableChanges();
  {
    let availablePorts = this.availablePorts; // возможно ранее уже был вызван showPlanePortsAvailability (ВАЖНО чтобы не было pop/unshift от availablePorts)
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

  this.set({ availablePorts: [], previewPlaneId: null });

  joinPort.updateDirect(joinPortDirect);
  targetPort.updateDirect(targetPortDirect);
  this.run('createBridge', { joinPort, targetPort });

  joinPlane.moveToTarget(this.decks.table);
});
