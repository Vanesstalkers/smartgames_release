(function ({ diceId }) {
  const player = this.roundActivePlayer();
  if (this.triggerEventEnabled() || player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const dice = this.get(diceId);
  const zone = dice.getParent();

  if (dice.placedAtRound === this.round) throw new Error('Запрещено менять костяшки, размещенные на текущем ходу.');

  dice.set({ deleted: true });
  zone.updateValues();

  return { status: 'ok' };
});
