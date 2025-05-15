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

  const access = { [playerId]: {} };
  for (const player of game.players()) {
    player.find('Deck[plane]').set({ access });
  }
  game.decks.table.set({ access });
  game.decks.active.set({ access });
  if (game.gameConfig === 'cooperative') {
    game.find('Deck[domino_common]').set({ access/* , markNew: true */ });
    game.find('Deck[card_common]').set({ access/* , markNew: true */ });
  }

  const superGame = game.game();
  superGame.decks.table.set({ access });
  superGame.decks.active.set({ access });

  return player;
});
