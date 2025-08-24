(function (data) {
  const player = this.run('domain.addPlayer', data);
  const playerId = player.id();
  const superGame = this.game();

  if (!this.getTeamlead()) {
    player.set({ teamlead: true, active: true });
  }

  this.set({ playerMap: { [playerId]: {} } });
  for (const game of [this, superGame]) {
    const gameProcessEvent = game.eventData.activeEvents.find((e) => e.name === 'gameProcess');
    if (gameProcessEvent) gameProcessEvent.allowedPlayers(game.players({ readyOnly: false }));
  }

  const access = { [playerId]: {} };
  if (this.gameConfig === 'cooperative') {
    // доступ только для команды (наполняется с подключением каждого нового игрока)
    this.find('Deck[domino_common]').set({ access });
    this.find('Deck[card_common]').set({ access });
  }

  superGame.set({ playerMap: { [playerId]: {} } });
  superGame.decks.table.set({ access });
  superGame.decks.active.set({ access });

  const fullAccess = superGame.decks.table.access;
  player.find('Deck[plane]').set({ access: fullAccess });
  this.decks.table.set({ access: fullAccess });
  this.decks.active.set({ access: fullAccess });

  for (const player of superGame.players()) {
    player.find('Deck[plane]').set({ access });
  }
  for (const game of superGame.getAllGames()) {
    game.decks.table.set({ access });
    game.decks.active.set({ access });
  }

  player.markNew();

  return player;
});
