(function (data) {
  const game = data.parentGame;
  const player = this.run('domain.addPlayer', data);
  const playerId = player.id();

  player.markDelete();
  player.deleteFromParentsObjectStorage();
  game.set({ playerMap: { [playerId]: null } });
});
