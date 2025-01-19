() => {
  const { init, handlers } = lib.game.events.common.gameProcess();

  return {
    init,
    handlers: {
      ...handlers,
      RELEASE: function () {
        const { game, player } = this.eventContext();
        if (game.checkFieldIsReady()) return game.run('endGame', { winningPlayer: player });
        const playerCardDeck = player.find('Deck[card]');
        game.run('smartMoveRandomCard', { target: playerCardDeck });
        lib.timers.timerRestart(game, { extraTime: game.settings.timerReleasePremium });
        game.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`);

        return { preventListenerRemove: true };
      },
      ADD_PLANE: function ({ target: plane }) {
        const { game, player } = this.eventContext();

        for (const event of plane.eventData.activeEvents) {
          event.emit('ADD_PLANE');
        }

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
        if (availableZoneCount > dominoInDeck + dominoInHand) {
          return game.run('endGame', {
            message: 'Оставшихся костяшек домино не достаточно, чтобы закрыть все свободные зоны игрового поля',
          });
        }

        return { preventListenerRemove: true };
      },
    },
  };
};
