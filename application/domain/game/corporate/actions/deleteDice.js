(function ({ diceId }) {
  if (this.fieldIsBlocked()) throw new Error('Нельзя изменять игровое поле в текущем статусе.');

  return this.run('domain.deleteDice', { diceId });
});
