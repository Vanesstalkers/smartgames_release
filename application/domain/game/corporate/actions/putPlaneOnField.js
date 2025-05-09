(function ({ joinPortId, targetPortId, targetPortDirect, joinPortDirect }, initPlayer) {
  const joinPort = this.get(joinPortId);
  const joinPlane = joinPort.parent();
  const targetPort = this.get(targetPortId);
  const targetPlane = targetPort.parent();
  const joinGame = joinPort.game();
  let targetGame = targetPort.game();
  if (targetGame.merged) targetGame = targetGame.game();
  const targetTable = targetGame.decks.table;

  const beforeAddPlaneResult = targetGame.toggleEventHandlers('BEFORE_ADD_PLANE', { targetId: joinPlane.id() }, initPlayer);
  const beforeAddPlaneError = beforeAddPlaneResult?.find((_) => _.error && _.error !== 'access_not_allowed'); // access_not_allowed - не ошибка обработчика, а доступа пользователя к обработчику (не существенно в данном случае)
  if (beforeAddPlaneError) throw new Error(beforeAddPlaneError.error);

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
  const moveResult = joinPlane.moveToTarget(targetTable, {
    anchorGameId: targetPlane.anchorGameId,
  });

  if (moveResult?.error) throw new Error(moveResult.error);
});
