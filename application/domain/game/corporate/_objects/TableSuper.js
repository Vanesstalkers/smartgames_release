(class TableSuper extends domain.game._objects.Table {
  emitAddItemHandler(handler, item) {
    const game = this.game();
    const itemGame = game.getAllGames().find((game) => game.id() === item.anchorGameId);
    const targetId = item.id();
    let initPlayer;
    if (itemGame) {
      initPlayer = itemGame.roundActivePlayer();
      itemGame.toggleEventHandlers(handler, { targetId }, initPlayer);
    }
    return game.toggleEventHandlers(handler, { targetId }, initPlayer);
  }
  afterAddItem(item) {
    this.emitAddItemHandler('ADD_PLANE', item);
  }
});
