() => ({
  init: function () {
    const { game, player } = this.eventContext();

    this.fillHandWithDices(game);
    
    return { resetEvent: true };
  },
  fillHandWithDices(game) {
    const deck = game.find('Deck[domino]');
    for (const player of game.players()) {
      const hand = player.find('Deck[domino]');
      const count = hand.itemsCount();
      deck.moveRandomItems({ count: game.settings.playerHandLimit - count, target: hand });
    }
  }
});
