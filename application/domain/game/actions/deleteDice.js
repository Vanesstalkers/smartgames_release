(function ({ diceId }, player) {
  if (player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие');

  const dice = this.get(diceId);
  if (dice.placedAtRound === this.round) throw new Error('Запрещено менять костяшки, размещенные на текущем ходу');

  const eventName = 'diceReplacementEvent';
  let event = this.eventData.activeEvents.find((e) => e.name === eventName);
  if (!event) event = this.run('initDiceReplacementEvent', {}, player);
  event.addDeletedDice(dice);

  const zone = dice.getParent();
  zone.updateValues();

  return { status: 'ok' };
});
