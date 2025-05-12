() => ({
  init: function () {
    const { game, player } = this.eventContext();
    const deck = player.find('Deck[domino]');

    const eventData = { dice: {} };
    for (const dice of deck.select('Dice')) {
      eventData.dice[dice.id()] = { selectable: true };
    }
    if (Object.keys(eventData.dice).length === 0) return { resetEvent: true };

    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      const { game, player: activePlayer } = this.eventContext();
      this.emit('DEACTIVATE');
      activePlayer.set({ eventData: { player: null } });
      this.destroy();
    },
    DEACTIVATE: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { dice: null } });
    },
    TRIGGER: function ({ target }) {
      const { game, player: activePlayer } = this.eventContext();

      if (!target) return this.emit('RESET');

      if (!this.targetDice) {
        this.targetDice = target;

        this.emit('DEACTIVATE');

        if (game.isSinglePlayer()) {
          target.moveToTarget(game.find('Deck[domino]'));
          return this.emit('RESET');
        }

        const players = game.players();
        if (players.length === 2) {
          const target = players.find((p) => p !== activePlayer);
          return this.emit('TRIGGER', { target });
        } else {
          const eventData = { player: {} };
          for (const player of game.players()) {
            if (player === activePlayer) continue;
            eventData.player[player.id()] = { selectable: true };
          }
          activePlayer.set({ eventData });
        }

        return { preventListenerRemove: true };
      }

      this.targetDice.moveToTarget(target.find('Deck[domino]'));

      game.logs({
        msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
        userId: target.userId,
      });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      const players = game.players();

      if (!this.targetDice) {
        const targetDice = player.find('Deck[domino]').select('Dice')[0];
        if (game.isSinglePlayer()) return this.emit('TRIGGER', { target: targetDice });
        this.targetDice = targetDice; // иначе внутри TRIGGER не попадет в  if(game.isSinglePlayer()){...}
      }

      const activePlayerIndex = players.findIndex(p => p === player);
      const nextPlayerIndex = (activePlayerIndex + 1) % players.length;

      this.emit('TRIGGER', {
        target: players[nextPlayerIndex],
      });
    },
  },
});
