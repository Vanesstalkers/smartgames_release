() => ({
  init: function () {
    const { game, player } = this.eventContext();

    let diceFound = false;
    const deck = player.find('Deck[domino]');
    const eventData = { dice: {} };
    for (const dice of deck.select('Dice')) {
      eventData.dice[dice.id()] = { selectable: true };
      diceFound = true;
    }
    if (!diceFound) return { removeEvent: true };

    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      const { game, player: activePlayer, source, sourceId } = this.eventContext();

      this.emit('DEACTIVATE');

      for (const player of game.players()) {
        if (player === activePlayer) continue;
        player.set({ eventData: { selectable: null } });
      }
      activePlayer.set({ eventData: { canSelectWorkers: null } });

      source.removeEvent(this);
      activePlayer.removeEvent(this);
      game.removeAllEventListeners({ event: this });
    },
    DEACTIVATE: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { dice: null } });
    },
    TRIGGER: function ({ target }) {
      const { game, player: activePlayer } = this.eventContext();

      if (!target) return;

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
          for (const player of game.players()) {
            if (player === activePlayer) continue;
            player.set({ eventData: { selectable: true } });
          }
          activePlayer.set({ eventData: { canSelectWorkers: true } });
        }

        return { preventListenerRemove: true };
      }

      const targetDeck = target.find('Deck[domino]');
      this.targetDice.moveToTarget(targetDeck);

      const isPlayer = target.matches({ className: 'Player' }); // тут может быть game
      if (isPlayer) {
        game.logs({
          msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
          userId: target.userId,
        });
      }

      this.targetPlayer = target;
      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();

      if (!this.targetDice) {
        const dice = player.find('Deck[domino]').select('Dice')[0];
        if (game.isSinglePlayer()) return this.emit('TRIGGER', { target: dice });
        this.targetDice = dice;
      }

      this.emit('TRIGGER', {
        target: game.select('Player').find((p) => p !== player),
      });
    },
  },
});
