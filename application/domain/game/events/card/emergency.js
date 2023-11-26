() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const deck = game.find('Deck[domino]');
    for (const player of game.players()) {
      const hand = player.find('Deck[domino]');
      const count = hand.itemsCount();
      deck.moveRandomItems({ count: game.settings.playerHandLimit - count, target: hand });
    }
    
    return { removeEvent: true };
  },
});
