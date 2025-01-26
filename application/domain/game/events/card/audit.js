() => ({
  init: function () {
    const { game, player } = this.eventContext();

    for (const player of game.players()) {
      player.set({ eventData: { selectable: true } });
    }
    player.set({ eventData: { canSelectWorkers: true } });
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();

      for (const player of game.players()) {
        player.set({ eventData: { selectable: null } });
      }
      player.set({ eventData: { canSelectWorkers: null } });

      this.destroy();
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = targetPlayer.find('Deck[domino]');
      for (const dice of targetPlayerHand.select({ className: 'Dice', directParent: false })) {
        dice.set({ visible: true });
        dice.markNew(); // у других игроков в хранилище нет данных об этом dice
      }
      targetPlayerHand.set({ itemMap: targetPlayerHand.itemMap }); // инициирует рассылку изменений с пересчетом видимости

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();
      this.emit('TRIGGER', { target: player });
    },
  },
});
