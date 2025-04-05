() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { dside: {} };
    for (const deck of player.select('Deck')) {
      if (deck.type !== 'domino') continue;
      for (const dice of deck.select('Dice')) {
        for (const dside of dice.select('DiceSide')) {
          eventData.dside[dside.id()] = { selectable: true };
        }
      }
    }
    if (Object.keys(eventData.dside).length === 0) return { resetEvent: true };

    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      this.emit('DEACTIVATE');
      this.destroy();
    },
    DEACTIVATE: function () {
      const { player } = this.eventContext();
      player.removeEventWithTriggerListener(); // без этого будут срабатывать проверки player.triggerEventEnabled

      const eventData = { dside: {} };
      for (const sideId in player.eventData.dside) {
        eventData.dside[sideId] = null;
      }
      player.set({ eventData });
    },
    TRIGGER: function ({ target, fakeValue = 0, skipFakeValueSet }) {
      const { game, player } = this.eventContext();

      if (fakeValue === undefined) return;
      if (!skipFakeValueSet) {
        if (!target) return;
        const realValue = target.eventData.fakeValue?.realValue ?? target.value;
        target.set({ eventData: { fakeValue: { realValue } }, value: fakeValue });
        game.set({ crutchMap: { [target.id()]: true } });

        this.targetSide = target;
      }

      this.emit('DEACTIVATE');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();

      if (this.targetSide) {
        const dside = this.targetSide;
        dside.set({
          value: dside.eventData.fakeValue?.realValue ?? dside.value,
          eventData: { fakeValue: null },
        });

        const zoneParent = dside.findParent({ className: 'Zone' });
        if (zoneParent) {
          // не пишем в лог сообщение о костяшках в руке, чтобы соперники не узнали об их наличии
          game.logs(`Костяшка "${dside.getParent().getTitle()}" восстановила свои значения, измененные событием "Костыль".`);

          zoneParent.updateValues();
        }
      }

      this.emit('RESET');
    },
  },
});
