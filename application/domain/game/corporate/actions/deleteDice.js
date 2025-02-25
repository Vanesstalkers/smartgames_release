(function ({ diceId }) {
  if (this.mergeStatus() === 'freezed')
    throw new Error('Нельзя изменять игровое поле в текущем статусе.');

  return this.run('domain.deleteDice', { diceId });
});
