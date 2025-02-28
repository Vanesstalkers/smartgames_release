() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { dice: {} };
    let diceFound = false;
    for (const plane of game.decks.table.getAllItems()) {
      for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }
    for (const bridge of game.select('Bridge')) {
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
      const { player } = this.eventContext();

      player.set({ eventData: { dice: null } });
      player.removeEventWithTriggerListener(); // иначе сохранится блокировка на другие действия
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
      this.emit('DEACTIVATE');
    },
    END_ROUND: function () {
      const { game } = this.eventContext();

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

      this.targetDice?.set({ locked: null });

      this.emit('RESET');
    },
  },
});
