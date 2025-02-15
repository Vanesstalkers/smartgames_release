() => ({
  init: function () {
    let { game, player } = this.eventContext();
    let planes = game.decks.table.select('Plane');
    let bridges = game.select('Bridge');

    if (game.hasSuperGame) {
      const superGame = game.game();
      planes = superGame.select('Plane');
      if (!game.checkFieldIsReady()) {
        planes = planes.filter((plane) => plane.sourceGameId !== superGame.id());
      }
      bridges = superGame.select('Bridge');
      if (!game.checkFieldIsReady()) {
        bridges = bridges.filter((bridge) => bridge.sourceGameId !== superGame.id());
      }
    }

    const eventData = { dice: {} };
    let diceFound = false;
    for (const plane of planes) {
      for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }
    for (const bridge of bridges) {
      for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }

    if (!diceFound) return { resetEvent: true };

    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      this.emit('DEACTIVATE');
      this.destroy();
    },
    DEACTIVATE: function () {
      let { game, player } = this.eventContext();
      if (game.hasSuperGame && game.checkFieldIsReady()) game = game.game();

      player.set({ eventData: { dice: null } });
    },
    TRIGGER: function ({ target: dice }) {
      const { game, player } = this.eventContext();
      const parent = dice.findParent({ className: 'Zone' }).getParent(); // тут может быть Bridge
      const playerHand = player.find('Deck[domino]');

      dice.moveToTarget(playerHand);
      dice.set({ visible: true, locked: true });
      parent.set({ release: null });

      game.logs({
        msg: `Игрок {{player}} забрал со стола костяшку "${dice.getTitle()}".`,
        userId: player.userId,
      });

      this.targetDice = dice;
      this.emit('DEACTIVATE'); // не удаляем событие, чтобы в конце раунда снялся locked-флаг
    },
    END_ROUND: function () {
      let { game, player } = this.eventContext();
      if (game.hasSuperGame && game.checkFieldIsReady()) game = game.game();

      if (!this.targetDice) {
        // ищем первый попавшийся dice
        for (const plane of game.decks.table.getAllItems()) {
          for (const dice of plane.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if (this.targetDice) break;
          }
          if (this.targetDice) break;
        }
      }
      if (!this.targetDice) {
        for (const bridge of game.select('Bridge')) {
          for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if (this.targetDice) break;
          }
          if (this.targetDice) break;
        }
      }

      for (const dice of game.select('Dice')) {
        if (dice.locked) dice.set({ locked: null });
      }
      this.emit('RESET');
    },
  },
});
