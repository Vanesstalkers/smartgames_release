() => ({
  tutorial: {
    text: (card) => `Игрок добирает полную руку костяшек (<a>до ${card.game().settings.playerHandLimit} штук</a>)`,
  },
  init: function () {
    const { game, player } = this.eventContext();
    const deck = game.find('Deck[domino]');
    const hand = player.find('Deck[domino]');
    const count = hand.itemsCount();
    
    deck.moveRandomItems({
      count: game.settings.playerHandLimit - count,
      target: hand,
    });

    return { resetEvent: true };
  },
});
