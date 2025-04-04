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
        game.run('initGameFieldsMerge');
      }

      return { preventListenerRemove: true };
    };
  }

  return this.initEvent({
    name: 'initGameProcessEvents',
    ...event
  }, { allowedPlayers });
});
