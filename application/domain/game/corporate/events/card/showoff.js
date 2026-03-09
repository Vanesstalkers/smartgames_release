(function event() {
  const event = domain.game.events.card.showoff();
  const game = this.game();

  if (game.gameConfig === 'cooperative') {
    event.tutorial.text = (card) => {
      const deck = card.parent();
      const game = deck.game();

      let handLimit = game.settings.playerHandLimit;
      if (deck.subtype === 'common') handLimit *= game.players().length;

      return `Игрок добирает полную руку костяшек (<a>до ${handLimit} штук</a>)`;
    };
  }

  event.init = function () {
    const { game, player } = this.eventContext();
    const playerGame = player.game();
    const deck = playerGame.find('Deck[domino]');
    const hand = player.getHandDominoDeck();
    const count = hand.itemsCount();
    const handLimit =
      playerGame.merged && playerGame.gameConfig === 'cooperative'
        ? playerGame.settings.playerHandLimit * playerGame.players().length
        : playerGame.settings.playerHandLimit;

    deck.moveRandomItems({
      count: handLimit - count,
      target: hand,
    });

    return { resetEvent: true };
  };

  return event;
});
