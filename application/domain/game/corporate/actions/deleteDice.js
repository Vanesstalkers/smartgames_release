(function ({ diceId }, player) {
  const game = this.merged ? this.game() : this;
  if (game.fieldIsBlocked()) throw new Error('Игровое поле заблокировано для изменения.');

  return game.run('domain.deleteDice', { diceId }, player);
});
