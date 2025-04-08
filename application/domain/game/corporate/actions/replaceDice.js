(function ({ diceId, zoneId }, player) {
  const fieldGame = this.merged ? this.game() : this;
  if (fieldGame.fieldIsBlocked()) throw new Error('Нельзя изменять игровое поле в текущем статусе.');
  const playerGame = player.game();

  fieldGame.run('domain.replaceDice', { diceId, zoneId }, player);

  if (fieldGame !== playerGame) {
    // тут будет teamlead и flowstate с размещением на чужое поле
    playerGame.toggleEventHandlers('DICE_PLACED', { dice: fieldGame.get(diceId) }, player);
  }
});
