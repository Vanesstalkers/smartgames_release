(function event() {
  const event = domain.game.events.card.claim();

  event.tutorial.text += '<br><a>Можно применять к игрокам любой команды</a>';

  event.init = function () {
    const { game, player } = this.eventContext();
    const superGame = game.hasSuperGame ? game.game() : game;

    const eventData = { player: {}, game: {} };
    for (const player of superGame.players()) {
      eventData.player[player.id()] = { selectable: true };

      const playerGame = player.game();
      if (playerGame !== game) eventData.game[playerGame.id()] = { highlight: true };
    }
    player.set({ eventData });
  };

  event.handlers['RESET'] = function () {
    const { player: activePlayer } = this.eventContext();
    activePlayer.set({ eventData: { player: null, game: null } });
    this.destroy();
  };

  event.handlers['TRIGGER'] = function ({ target: targetPlayer }) {
    const { game, player } = this.eventContext();

    if (targetPlayer.eventData.dice || targetPlayer.eventData.dside) {
      player.notifyUser('Игрок не может стать целью, так как у него активировано событие руки.');
      return { preventListenerRemove: true };
    }

    game.logs({
      msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
      userId: targetPlayer.userId,
    });

    for (const dice of targetPlayer.getHandDominoDeck().items()) {
      dice.moveToDeck();
    }

    this.emit('RESET');
  };

  return event;
});
