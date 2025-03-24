() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { dice: {} };
    let diceFound = false;
    for (const plane of game.decks.table.items()) {
      for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        if (dice.deleted) continue;
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }
    for (const bridge of game.select('Bridge')) {
      for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        if (dice.deleted) continue;
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

      // выставить просто {dice: null}, нельзя т.к. если дальше в событиях будут добавляться новые dice, то сохраняемый объект не будет содержать информацию о тех, с которых нужно снять флаги
      for (const diceId in player.eventData.dice) {
        player.set({ eventData: { dice: { [diceId]: null } } });
      }
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
        for (const plane of game.decks.table.items()) {
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

      if (this.targetDice) {
        // если сделать { locked: null }, то при возврате dice в колоду информация о ней не придет (из-за fakeId) - в store frontend-а останется locked=true, которое не обновится{ locked: false } при взятии dice в руку, т.к. на бэкенде locked уже удален
        this.targetDice?.set({ locked: false });
      }

      this.emit('RESET');
    },
  },
});
