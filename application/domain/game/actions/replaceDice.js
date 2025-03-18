(function ({ diceId, zoneId }, player) {
  if (player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const dice = this.get(diceId);
  const zone = this.get(zoneId);
  const diceIsInHand = dice.parent().access[player.id()] ? true : false;

  if (zone.game().fieldIsBlocked()) {
    throw new Error('Действия с этим полем недоступны до следующего раунда.');
  }

  if (!player.eventData.availableZones?.includes(zoneId)) throw new Error('Данная зона запрещена для размещения');
  if (!diceIsInHand) throw new Error('Костяшка должна находиться в руке.');
  if (dice.locked) throw new Error('Костяшка не может быть сыграна на этом ходу.');

  const deletedDices = this.getDeletedDices();
  const replacedDice = deletedDices.find((d) => {
    const diceZone = d.parent();
    if (diceZone === zone) return true;

    const isBridgeZone = diceZone.isBridgeZone();
    const isNearZone = diceZone.getNearZones().includes(zone);
    return isBridgeZone && isNearZone ? true : false;
  });
  const remainDeletedDices = deletedDices.filter((d) => d != replacedDice);

  if (!replacedDice && remainDeletedDices.length > 0)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных.');

  dice.moveToTarget(zone);
  dice.set({ placedAtRound: this.round });

  // у других игроков в хранилище нет данных об этом dice
  dice.markNew();

  this.toggleEventHandlers('DICE_PLACED', { dice }, player);
  if (
    // checkForRelease отработает после завершения события DICE_PLACED в diceReplacementEvent
    !this.eventData.activeEvents.find((e) => e.name === 'diceReplacementEvent')
  ) {
    this.checkForRelease({
      zoneParent: zone.parent(),
      player, // для корпоративных игр обязательно указываем player, иначе инициатором будет считаться активный игрок из игры-владельца field-а
    });
  }
});
