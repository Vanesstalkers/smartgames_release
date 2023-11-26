() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');
    const hand = player.find('Deck[domino]');
    const count = hand.itemsCount();
    deck.moveRandomItems({
      count: game.settings.playerHandLimit - count,
      target: hand,
    });
  },
});
