() => ({
  init: function () {
    const { game, player } = this.eventContext();

    const eventData = { player: {} };
    for (const player of game.players()) {
      eventData.player[player.id()] = { selectable: true };
    }
    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      const { game, player } = this.eventContext();
      player.set({ eventData: { player: null } });
      this.destroy();
    },
    TRIGGER: function ({ target: targetPlayer }) {
      const { game, player } = this.eventContext();

      game.logs({
        msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
        userId: targetPlayer.userId,
      });

      const targetPlayerHand = this.getPlayerDeck(targetPlayer);
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
  getPlayerDeck(player) {
    return player.find('Deck[domino]');
  },
});
