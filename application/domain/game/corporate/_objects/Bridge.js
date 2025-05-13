(class Bridge extends domain.game._objects.Bridge {
  constructor(data) {
    super(...arguments);
    let { mergedGameId, anchorGameId } = data;
    const game = this.game();
    if (!anchorGameId) anchorGameId = game.id();

    if (game.merged) this.game(game.game());

    this.set({ mergedGameId, anchorGameId });
    this.broadcastableFields(['anchorGameId', 'mergedGameId']);
  }
  game(game) {
    const currentGame = super.game();
    if (!game) return currentGame;
    super.game(game);

    if (game === currentGame) return;

    for (const obj of this.getAllObjects({ directParent: false })) {
      obj.game(game);
    }
  }
});
