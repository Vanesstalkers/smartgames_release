(function () {
  const deck = this.find('Deck[domino]');
  for (const player of this.players()) {
    const playerHand = player.find('Deck[domino]');
    deck.moveRandomItems({ count: this.settings.playerHandStart, target: playerHand });

    this.initEvent(
      {
        handlers: {
          PLAYER_TIMER_END: function () {
            const { game, player } = this.eventContext();

            game.logs({
              msg: `Игрок {{player}} не успел завершить все действия за отведенное время, и раунд завершится автоматически.`,
              userId: player.userId,
            });

            const timerOverdueCounter = (game.timerOverdueCounter || 0) + 1;
            // если много ходов было завершено по таймауту, то скорее всего все игроки вышли и ее нужно завершать
            if (timerOverdueCounter > game.settings.autoFinishAfterRoundsOverdue) {
              game.run('endGame');
            }
            game.set({ timerOverdueCounter });

            game.run('endRound');
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
            if (finalRelease) {
              game.run('endGame', { winningPlayer: player });
            }
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
            if (availableZoneCount > dominoInDeck + dominoInHand) {
              game.run('endGame');
            }

            return { preventListenerRemove: true };
          },
        },
      },
      { player, defaultResetHandler: true }
    );
  }

  this.set({ status: 'IN_PROCESS' });
  this.run('endRound', { forceActivePlayer: this.players()[0] });

  return { status: 'ok' };
});
