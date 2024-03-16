() => ({
  init: function () {
    const { game, player } = this.eventContext();

    let diceFound = false;
    for (const deck of player.select('Deck')) {
      if (deck.type !== 'domino') continue;
      for (const dice of deck.select('Dice')) {
        for (const dside of dice.select('DiceSide')) {
          dside.set({ eventData: { selectable: true } });
          diceFound = true;
        }
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
      game.removeAllEventListeners({ sourceId });
    },
    DEACTIVATE: function () {
      const { game, player } = this.eventContext();
      player.removeEvent(this);
      for (const deck of player.select('Deck')) {
        if (deck.type !== 'domino') continue;
        for (const dice of deck.select('Dice')) {
          for (const dside of dice.select('DiceSide')) {
            dside.set({ eventData: { selectable: null } });
          }
        }
      }
    },
    TRIGGER: function ({ target, fakeValue = 0, skipFakeValueSet }) {
      const { game, player } = this.eventContext();

      if (fakeValue === undefined) return;
      if (!skipFakeValueSet) {
        if (!target) return;
        const realValue = target.eventData.fakeValue?.realValue ?? target.value;
        target.set({ eventData: { fakeValue: { realValue } }, value: fakeValue });
        game.set({ crutchMap: { [target.id()]: true } });
      }

      this.emit('DEACTIVATE');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();

      const restoredDices = {};
      for (const dside of game.select('DiceSide')) {
        if (dside.eventData.fakeValue) {
          dside.set({
            value: dside.eventData.fakeValue.realValue,
            eventData: { fakeValue: null },
          });
          const zoneParent = dside.findParent({ className: 'Zone' });
          if (zoneParent) {
            zoneParent.updateValues();
            // не пишем в лог сообщение о костяшках в руке, чтобы соперники не узнали об их наличии
            const dice = dside.getParent();
            restoredDices[dice._id] = dice;
          }
        }
      }
      for (const dice of Object.values(restoredDices)) {
        game.logs(`Костяшка "${dice.getTitle()}" восстановила свои значения, измененные событием "Костыль".`);
      }

      this.emit('RESET');
    },
  },
});
