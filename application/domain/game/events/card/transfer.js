() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const playerHand = player.find('Deck[domino]');
    const gameDeck = game.find('Deck[domino]');
    const count = playerHand.itemsCount();

    playerHand.moveAllItems({ target: gameDeck });
    gameDeck.moveRandomItems({ count, target: playerHand });

    return { removeEvent: true };
  },
});
