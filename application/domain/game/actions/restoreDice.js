(function ({ diceId }) {
  const player = this.roundActivePlayer();
  if (this.triggerEventEnabled() || player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const dice = this.get(diceId);
  const zone = dice.getParent();

  const isAvailable = zone.checkIsAvailable(dice);
  if (!isAvailable) {
    return this.toggleEventHandlers('DICE_RESTORE_NOT_AVAILABLE', {
      msg: 'Ошибка восстановления удаленной костяшки.',
    });
  }

  if (isAvailable === 'rotate') dice.rotate();
  dice.set({ deleted: null });
  zone.updateValues();

  this.toggleEventHandlers('DICE_PLACED');
});
