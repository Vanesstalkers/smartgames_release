(function ({ diceId }, player) {
  const dice = this.get(diceId);
  this.initTableDiceAction({ dice, player });

  const zone = dice.getParent();

  const { status, msg = 'Ошибка восстановления удаленной костяшки. Размещенные костяшки возвращены в руки игроков.' } = zone.checkIsAvailable(dice);
  if (status !== true) {
    return this.toggleEventHandlers('DICE_RESTORE_NOT_AVAILABLE', { msg }, player);
  }

  if (status === 'rotate') dice.rotate();
  dice.set({ deleted: null });
  zone.updateValues();

  this.toggleEventHandlers('DICE_PLACED', { dice }, player);
});
