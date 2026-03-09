() => ({
  tutorial: {
    text: 'У выбранного игрока все костяшки из руки возвращаются в колоду, а затем он добирает такое же количество костяшек обратно себе в руку',
  },
  init: function () {
    const { game, player } = this.eventContext();

    if (game.isSinglePlayer()) {
      const playerHand = player.find('Deck[domino]');
      const gameDeck = game.find('Deck[domino]');
      const count = playerHand.itemsCount();

      playerHand.moveAllItems({ target: gameDeck });
      gameDeck.moveRandomItems({ count, target: playerHand });

      return { resetEvent: true };
    } else {
      const superGame = game.hasSuperGame ? game.game() : game;

      const eventData = { player: {} };
      for (const player of superGame.players()) {
        eventData.player[player.id()] = { selectable: true };
      }
      player.set({ eventData });
    }
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { player: null, game: null } });
      this.destroy();
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
        userId: targetPlayer.userId,
      });

      const playerHand = targetPlayer.find('Deck[domino]');
      const gameDeck = game.find('Deck[domino]');
      const count = playerHand.itemsCount();

      playerHand.moveAllItems({ target: gameDeck });
      gameDeck.moveRandomItems({ count, target: playerHand });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { target: player });
    },
  },
});
