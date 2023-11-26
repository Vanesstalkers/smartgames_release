() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');
    const hand = player.find('Deck[domino]');
    deck.moveRandomItems({ count: 1, target: hand });
  },
});
