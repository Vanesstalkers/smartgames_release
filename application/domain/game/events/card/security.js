() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const deck = game.find('Deck[domino]');
    for (const bridge of game.select('Bridge')) {
      for (const dice of bridge.select('Dice')) {
        dice.moveToTarget(deck);
      }
      bridge.set({ release: null });
    }
  },
});
