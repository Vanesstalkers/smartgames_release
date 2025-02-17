(class Bridge extends domain.game._objects.Bridge {
  constructor(data) {
    super(...arguments);
    const { mergedGameId, anchorGameId } = data;
    this.set({ mergedGameId, anchorGameId });
    this.broadcastableFields(['anchorGameId']);
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
