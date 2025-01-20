() => ({
  init: function () {
    const { game, player } = this.eventContext();

    let diceFound = false;
    for (const plane of game.select('Plane')) {
      for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        dice.set({ eventData: { selectable: true } });
        diceFound = true;
      }
    }
    for (const bridge of game.select('Bridge')) {
      for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        dice.set({ eventData: { selectable: true } });
        diceFound = true;
      }
    }
    if (!diceFound) return { removeEvent: true };
  },
  handlers: {
    RESET: function () {
      const { game, player, source, sourceId } = this.eventContext();

      this.emit('DEACTIVATE');

      source.removeEvent(this);
      player.removeEvent(this);
      game.removeAllEventListeners({ event: this });
    },
    DEACTIVATE: function () {
      const { game, player } = this.eventContext();

      for (const plane of game.decks.table.getAllItems()) {
        for (const dice of plane.select({ className: 'Dice', directParent: false })) {
          dice.set({ eventData: { selectable: null } });
        }
      }
      for (const bridge of game.select('Bridge')) {
        for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
          dice.set({ eventData: { selectable: null } });
        }
      }
      this.targetDice.set({ eventData: { selectable: null } });
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
      const { game, player } = this.eventContext();

      if (!this.targetDice) {
        // ищем первый попавшийся dice
        for (const plane of game.decks.table.getAllItems()) {
          for (const dice of plane.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if(this.targetDice) break;
          }
          if(this.targetDice) break;
        }
      }
      if (!this.targetDice) {
        for (const bridge of game.select('Bridge')) {
          for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if(this.targetDice) break;
          }
          if(this.targetDice) break;
        }
      }

      for (const dice of game.select('Dice')) {
        if (dice.locked) dice.set({ locked: null });
      }
      this.emit('RESET');
    },
  },
});
