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

        game.checkDiceResource();

        return { preventListenerRemove: true };
      },
    },
  };
};
