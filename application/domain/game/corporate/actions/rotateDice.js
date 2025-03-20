(function ({ diceId }, player) {
  if (this.fieldIsBlocked()) throw new Error('Нельзя изменять игровое поле в текущем статусе.');

  return this.run('domain.rotateDice', { diceId }, player);
});
