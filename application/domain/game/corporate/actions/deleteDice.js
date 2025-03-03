(function ({ diceId }) {
  if (this.fieldIsBlocked()) throw new Error('Игровое поле заблокировано для изменения.');

  return this.run('domain.deleteDice', { diceId });
});
