(function ({ diceId }, player) {
  if (player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие');

  const dice = this.get(diceId);
  const zone = dice.getParent();

  const { status, msg = 'Ошибка восстановления удаленной костяшки. Размещенные костяшки возвращены в руки игроков.' } = zone.checkIsAvailable(dice);
  if (status !== true) {
    return this.toggleEventHandlers('DICE_RESTORE_NOT_AVAILABLE', { msg });
  }

  if (status === 'rotate') dice.rotate();
  dice.set({ deleted: null });
  zone.updateValues();

  this.toggleEventHandlers('DICE_PLACED', { dice }, player);
});
