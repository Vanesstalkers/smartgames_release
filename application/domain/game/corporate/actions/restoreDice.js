(function ({ diceId }, player) {
  const game = this.merged ? this.game() : this;
  if (game.fieldIsBlocked()) throw new Error('Нельзя изменять игровое поле в текущем статусе');

  return game.run('domain.restoreDice', { diceId }, player);
});
