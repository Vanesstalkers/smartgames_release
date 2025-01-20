(function ({ diceId, zoneId }) {
  const dice = this.get(diceId);
  const zone = this.get(zoneId);

  if (zone.game().roundReady) throw new Error('Действия с этим полем недоступны до следующего раунда.');

  const player = this.roundActivePlayer();
  if (this.triggerEventEnabled() || player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  if (!player.eventData.availableZones?.includes(zoneId)) throw new Error('Данная зона запрещена для размещения');

  const diceIsInHand = dice.parent().access[player.id()] ? true : false;
  if (!diceIsInHand) throw new Error('Костяшка должна находиться в руке.');

  if (dice.locked) throw new Error('Костяшка не может быть сыграна на этом ходу.');

  const deletedDices = this.getDeletedDices();
  const replacedOrRelatedDice = deletedDices.find((dice) => {
    const diceZone = dice.getParent();
    if (diceZone === zone) return true;

    const plane = diceZone.getParent();
    const isBridgeZone = plane.matches({ className: 'Bridge' });
    const nearZones = diceZone.getNearZones();
    return isBridgeZone && nearZones.includes(zone);
  });
  const remainDeletedDices = deletedDices.filter((dice) => dice != replacedOrRelatedDice);
  if (!replacedOrRelatedDice && remainDeletedDices.length)
    throw new Error('Добавлять новые костяшки можно только взамен временно удаленных.');

  if (replacedOrRelatedDice && zone !== replacedOrRelatedDice.getParent()) {
    if (!replacedOrRelatedDice.relatedPlacement) replacedOrRelatedDice.relatedPlacement = {};
    replacedOrRelatedDice.relatedPlacement[dice.id()] = true;
  }
  dice.moveToTarget(zone);
  dice.set({ placedAtRound: this.round });

  // у других игроков в хранилище нет данных об этом dice
  dice.markNew();

  this.run('checkForRelease', { zone }, player); // для корпоративных игр обязательно указываем player, иначе инициатором будет считаться активный игрок из игры-владельца field-а

  this.toggleEventHandlers('DICE_PLACED');
});
