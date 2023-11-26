(function ({ diceId }) {
  const player = this.getActivePlayer();
  if (this.triggerEventEnabled() || player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const playerHand = player.find('Deck[domino]');
  const dice = this.get(diceId);
  const zone = dice.getParent();

  const isAvailable = zone.checkIsAvailable(dice);
  if (!isAvailable && dice.relatedPlacement) {
    for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
      const relatedDice = this.get(relatedDiceId);
      relatedDice.moveToTarget(playerHand);
    }
  }

  if (isAvailable === 'rotate') dice.set({ sideList: [...dice.sideList.reverse()] });
  dice.set({ deleted: null });
  zone.updateValues();

  const deletedDices = this.run('getDeletedDices');
  if (isAvailable) {
    const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getNotDeletedItem());
    // все удаленные dice заменены
    if (notReplacedDeletedDices.length === 0) {
      const deck = this.find('Deck[domino]');
      for (const dice of deletedDices) {
        dice.set({ deleted: null });
        dice.moveToTarget(deck); // возвращаем удаленные dice в deck
      }
    }
  } else {
    const alreadyPlacedDices = deletedDices.map((dice) => dice.getParent().getNotDeletedItem()).filter((dice) => dice);
    for (const dice of alreadyPlacedDices) {
      dice.moveToTarget(playerHand);
    }
  }
});
