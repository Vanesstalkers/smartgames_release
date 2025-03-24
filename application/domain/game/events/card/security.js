() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const deck = game.find('Deck[domino]');
    const ids = [];
    for (const bridge of game.select('Bridge')) {
      for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        dice.moveToTarget(deck);
        ids.push(dice.id());
      }
      bridge.set({ release: null });
    }
    
    if (ids.length)game.game().broadcastEvent('DICES_DISABLED', { ids }); // если у кто активирован refactoring

    return { resetEvent: true };
  },
});
