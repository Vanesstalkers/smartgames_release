(class Bridge extends domain.game._objects.Bridge {
  constructor(data) {
    super(...arguments);
    this.set({ mergedGameId: data.mergedGameId });
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
