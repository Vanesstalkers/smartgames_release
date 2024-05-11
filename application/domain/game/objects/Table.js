(class Table extends lib.game.objects.Deck {
  afterAddItem(item) {
    this.game().toggleEventHandlers('ADD_PLANE', { targetId: item.id() });
  }
});
