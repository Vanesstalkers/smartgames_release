(function () {
  const event = domain.game.events.common.gameProcess();
  let allowedPlayers = this.players();

  if (!this.isSuperGame) {
    allowedPlayers = this.game().players();

    event.handlers['RELEASE'] = function ({ initPlayer }) {
      const { game, player } = this.eventContext();
      const playerCardDeck = initPlayer.find('Deck[card]');

      game.run('smartMoveRandomCard', { target: playerCardDeck });
      lib.timers.timerRestart(initPlayer.game(), { extraTime: game.settings.timerReleasePremium });
      game.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`);

      if (game.checkFieldIsReady() && !game.merged) {
        // this.emit('RESET');
        // game.removeEventListener({ handler: 'ADD_PLANE', eventToRemove: this });
        game.run('initGameFieldsMerge');
      }

      return { preventListenerRemove: true };
    };

    const addPlaneHandler = event.handlers['ADD_PLANE'];
    event.handlers['ADD_PLANE'] = function () {
      const { game, player } = this.eventContext();

      if (game.merged) return; // будет добавляться после восстановления игры
      
      return addPlaneHandler.call(this, ...arguments);
    };

    // if (game.merged)  return { preventListenerRemove: true };

    // ADD_PLANE

    // ??? PLAYER_TIMER_END

  }

  return this.initEvent({
    name: 'initGameProcessEvents',
    ...event
  }, { allowedPlayers });
});
