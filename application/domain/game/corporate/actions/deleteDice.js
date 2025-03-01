(function ({ diceId }) {
  if (this.fieldIsBlocked()) throw new Error('Игровое поле заблокировано для изменения.');

  // const dice = this.get(diceId);
  // const zoneParent = dice.parent().parent();
  // if (zoneParent.eventData.actionsDisabled)
  //   throw new Error('Необходимо дождаться действия, активированного для блока игрового поля.');

  return this.run('domain.deleteDice', { diceId });
});
