(function () {
  const event = domain.game.events.common.gameProcess();
  let allowedPlayers = this.players();

  if (!this.isSuperGame) {
    allowedPlayers = this.game().players();

    event.handlers['RELEASE'] = function ({ zoneParent, initPlayer }) {
      // принципиальная разница от gameProcess.RELEASE в том, что иницировать релиз моюет пользователь из другой игры

      const { game, player } = this.eventContext();
      const superGame = game.game();
      const playerCardDeck = initPlayer.find('Deck[card]');

      if (game.gameConfig === 'competition') {

        const gameId = game.id();
        const planeList = superGame.decks.table.items().filter(p => (p.anchorGameId === gameId || p.mergedGameId === gameId || p.customClass.includes('central')));
        const bridgeList = superGame.select('Bridge').filter(b => (b.anchorGameId === gameId || b.mergedGameId === gameId));

        let endGame = true;
        for (const releaseItem of [...planeList, ...bridgeList]) {
          if (!endGame) continue;
          if (releaseItem.hasEmptyZones()) endGame = false;
        }
        if (endGame) game.run('endGame', { winningPlayer: player });

        const anchorGame = superGame.get(zoneParent.anchorGameId);
        anchorGame.run('smartMoveRandomCard', { target: playerCardDeck });

        lib.timers.timerRestart(game, { extraTime: game.settings.timerReleasePremium });
        game.logs({
          msg: `Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`,
          userId: player.userId
        });

        if (!game.merged && game.checkFieldIsReady()) {
          // при необходимости можно доработать и использовать initGameFieldsPrepareMerge (проблемы с конфликтами интеграции для 4-й команды) 
          game.run('initGameFieldsMerge');
        }

        return { preventListenerRemove: true };
      }

      if (game.merged) {
        superGame.toggleEventHandlers('RELEASE', {}, initPlayer);
      } else {
        game.run('smartMoveRandomCard', { target: playerCardDeck });
        lib.timers.timerRestart(initPlayer.game(), { extraTime: game.settings.timerReleasePremium });
        game.logs({
          msg: `Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`,
          userId: initPlayer.userId
        });

        if (game.checkFieldIsReady()) {
          // при необходимости можно доработать и использовать initGameFieldsPrepareMerge (проблемы с конфликтами интеграции для 4-й команды) 
          game.run('initGameFieldsMerge');
        }
      }

      return { preventListenerRemove: true };
    };
  }

  return this.initEvent({
    name: 'initGameProcessEvents',
    ...event
  }, { allowedPlayers });
});
