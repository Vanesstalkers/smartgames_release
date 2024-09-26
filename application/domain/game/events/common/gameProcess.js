() => ({
  handlers: {
    PLAYER_TIMER_END: function () {
      const { game, player } = this.eventContext();
      game.logs({
        msg: `Игрок {{player}} не успел завершить все действия за отведенное время, и раунд завершится автоматически.`,
        userId: player.userId,
      });
      game.run('handleRound', { timerOverdue: true });
      return { preventListenerRemove: true };
    },
    RELEASE: function () {
      const { game, player } = this.eventContext();
      if (game.checkFieldIsReady()) return game.run('endGame', { winningPlayer: player });
      return { preventListenerRemove: true };
    },
    ADD_PLANE: function () {
      const { game, player } = this.eventContext();

      if (!game.isSinglePlayer()) return { preventListenerRemove: true };

      const planeList = game.decks.table.getAllItems();
      const bridgeList = game.getObjects({ className: 'Bridge', directParent: game });
      const dominoDeck = game.find('Deck[domino]');

      let availableZoneCount = 0;
      for (const plane of planeList) {
        availableZoneCount += plane.select('Zone').filter((zone) => !zone.getNotDeletedItem()).length;
      }
      for (const bridge of bridgeList) {
        availableZoneCount += bridge.select('Zone').filter((zone) => !zone.getNotDeletedItem()).length;
      }

      const dominoInDeck = dominoDeck.itemsCount();
      const dominoInHand = player.select({ className: 'Dice', directParent: false }).length;
      if (availableZoneCount > dominoInDeck + dominoInHand) return game.run('endGame');

      return { preventListenerRemove: true };
    },
  },
});
