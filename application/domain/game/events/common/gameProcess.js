() => {
  const { init, handlers } = lib.game.events.common.gameProcess();

  return {
    name: 'gameProcess',
    init,
    handlers: {
      ...handlers,
      RELEASE({ initPlayer: player }) {
        const { game } = this.eventContext();
        if (game.checkFieldIsReady()) return game.run('endGame', { winningPlayer: player });

        const playerCardDeck = player.find('Deck[card]');
        game.run('smartMoveRandomCard', { target: playerCardDeck });

        lib.timers.timerRestart(game, { extraTime: game.settings.timerReleasePremium });
        game.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`);

        return { preventListenerRemove: true };
      },
      ADD_PLANE({ target: plane }) {
        const { game } = this.eventContext();

        plane.eventData.activeEvents.forEach((event) => event.emit('ADD_PLANE'));
        game.checkDiceResource();

        return { preventListenerRemove: true };
      },
    },
  };
};
