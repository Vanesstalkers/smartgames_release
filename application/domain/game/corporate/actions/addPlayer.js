(function (data) {
  const game = data.parentGame;
  const player = this.run('domain.addPlayer', data);
  const playerId = player.id();

  player.markNew();
  player.updateParent(game);
  player.game(game);
  if (game.players().length === 0) {
    player.set({ teamlead: true, active: true });
  }

  game.set({ playerMap: { [playerId]: {} } });
  const gameProcessEvent = game.eventData.activeEvents.find(e => e.name === 'gameProcess');
  if (gameProcessEvent) gameProcessEvent.allowedPlayers(game.players());

  const access = { [playerId]: {} };
  if (game.gameConfig === 'cooperative') {
    // доступ только для команды (наполняется с подключением каждого нового игрока)
    game.find('Deck[domino_common]').set({ access/* , markNew: true */ });
    game.find('Deck[card_common]').set({ access/* , markNew: true */ });
  }

  const superGame = game.game();
  superGame.decks.table.set({ access });
  superGame.decks.active.set({ access });

  const fullAccess = superGame.decks.table.access;
  player.find('Deck[plane]').set({ access: fullAccess });
  game.decks.table.set({ access: fullAccess });
  game.decks.active.set({ access: fullAccess });

  for (const player of superGame.players()) {
    player.find('Deck[plane]').set({ access });
  }
  for (const game of superGame.getAllGames()) {
    game.decks.table.set({ access });
    game.decks.active.set({ access });
  }

  return player;
});
