(function ({ diceId }, player) {
  if (player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const dice = this.get(diceId);
  const zone = dice.getParent();
  const checkItemCanBeRotated = zone.checkItemCanBeRotated();

  if (checkItemCanBeRotated) {
    dice.set({ sideList: [...dice.sideList.reverse()] });
    zone.updateValues();
  }
});
