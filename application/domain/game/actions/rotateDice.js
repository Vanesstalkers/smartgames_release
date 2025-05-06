(function ({ diceId }, player) {
  const dice = this.get(diceId);
  this.initTableDiceAction({ dice, player });

  const zone = dice.getParent();
  const checkItemCanBeRotated = zone.checkItemCanBeRotated();

  if (!checkItemCanBeRotated) throw new Error('Поворот выбранной костяшки невозможен');

  dice.set({ sideList: [...dice.sideList.reverse()] });
  zone.updateValues();

});
