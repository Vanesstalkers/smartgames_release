(function event() {
  const event = domain.game.events.card.emergency();
  const game = this.game();

  if (game.gameConfig === 'cooperative') {
    event.tutorial.text = (card) => {
      const deck = card.parent();
      const game = deck.game();

      let handLimit = game.settings.playerHandLimit;
      if (deck.subtype === 'common') handLimit *= game.players().length;

      return `Все игроки всех команд добирают полную руку костяшек (<a>до ${handLimit} штук</a>)`;
    };

    event.init = function () {
      const { game, player } = this.eventContext();
      const superGame = game.hasSuperGame ? game.game() : game;

      for (const game of superGame.getAllGames()) {
        if (game.merged) {
          const deck = game.find('Deck[domino]');
          const hand = game.find('Deck[domino_common]');
          const count = hand.itemsCount();
          const handLimit = game.settings.playerHandLimit * game.players().length;
          deck.moveRandomItems({ count: handLimit - count, target: hand });
        } else {
          this.fillHandWithDices(game);
        }
      }

      return { resetEvent: true };
    };
  }

  if (game.gameConfig === 'competition') {
    event.tutorial.text = (card) => {
      const deck = card.parent();
      const game = deck.game();

      let handLimit = game.settings.playerHandLimit;
      if (deck.subtype === 'common') handLimit *= game.players().length;

      return `Все игроки команды добирают полную руку костяшек (<a>до ${handLimit} штук</a>)`;
    };

    event.init = function () {
      const { game, player } = this.eventContext();
      this.fillHandWithDices(player.game());
    };
  }

  return event;
});
