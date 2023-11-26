(function () {
  this.initEvent(
    {
      init: function () {
        const { game, player } = this.eventContext();
        game.set({ status: 'IN_PROCESS' });
        game.run('endRound', { forceActivePlayer: game.players()[0] });
      },
      handlers: {
        PLAYER_TIMER_END: function () {
          const { game, player } = this.eventContext();
          game.run('endRound', { timerOverdue: true });
          return { preventListenerRemove: true };
        },
        FINAL_RELEASE: function () {
          const { game, player } = this.eventContext();
          const planeList = game.getObjects({ className: 'Plane', directParent: game });
          const bridgeList = game.getObjects({ className: 'Bridge', directParent: game });

          let finalRelease = true;
          for (const releaseItem of [...planeList, ...bridgeList]) {
            if (!finalRelease) continue;
            if (!releaseItem.release) finalRelease = false;
          }
          if (finalRelease) return game.endGame({ winningPlayer: player });
          return { preventListenerRemove: true };
        },

        ADD_PLANE: function () {
          const { game, player } = this.eventContext();

          if (!game.isSinglePlayer()) return { preventListenerRemove: true };

          const planeList = game.getObjects({ className: 'Plane', directParent: game });
          const bridgeList = game.getObjects({ className: 'Bridge', directParent: game });
          const dominoDeck = game.find('Deck[domino]');

          let availableZoneCount = 0;
          for (const plane of planeList) {
            availableZoneCount += plane.select('Zone').filter((zone) => !zone.getNotDeletedItem()).length;
          }
          for (const bridge of bridgeList) {
            availableZoneCount += bridge.select('Zone').filter((zone) => !zone.getNotDeletedItem()).length;
          }

          // !!! был баг с недостаточным количеством костяшек для закрытия всех зон
          const dominoInDeck = dominoDeck.select('Dice').length;
          const dominoInHand = player.select('Dice').length;
          if (availableZoneCount > dominoInDeck + dominoInHand) return game.endGame();

          return { preventListenerRemove: true };
        },
      },
    },
    {
      defaultResetHandler: true,
      player: this.players()[0],
    }
  );

  return { status: 'ok' };
});
