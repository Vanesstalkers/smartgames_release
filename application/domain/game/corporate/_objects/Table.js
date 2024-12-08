(class Table extends domain.game._objects.Table {
  afterAddItem(item) {
    const game = this.game();
    const itemGame = game.getAllGames().find((game) => game.id() === item.sourceGameId);
    const targetId = item.id();
    let initPlayer;
    if (itemGame) {
      initPlayer = itemGame.roundActivePlayer();
      itemGame.toggleEventHandlers('ADD_PLANE', { targetId });
    }
    game.toggleEventHandlers('ADD_PLANE', { targetId }, initPlayer);
  }
});
