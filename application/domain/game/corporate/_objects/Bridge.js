(class Bridge extends domain.game._objects.Bridge {
  constructor(data) {
    super(...arguments);
    let { mergedGameId, anchorGameId } = data;

    if (anchorGameId) this.game(lib.store('game').get(anchorGameId));
    else anchorGameId = this.game().id();

    if (this.game().merged) this.game(this.game().game());

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
