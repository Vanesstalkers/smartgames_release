(class Table extends lib.game.objects.Deck {
  afterAddItem(item) {
    const game = this.game();
    game.toggleEventHandlers('ADD_PLANE', { targetId: item.id() });
  }
});
