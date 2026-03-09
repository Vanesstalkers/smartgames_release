(function event() {
  const event = domain.game.events.card.disease();

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

  return event;
});
