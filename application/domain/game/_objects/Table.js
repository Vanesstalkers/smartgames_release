(class Table extends lib.game._objects.Deck {
  afterAddItem(item) {
    const game = this.game();
    game.toggleEventHandlers('ADD_PLANE', { targetId: item.id() });
  }
  getFreePortsCount() {
    return this.select({
      className: 'Port',
      directParent: false,
      attr: { linkedBridgeCode: undefined },
    }).length;
  }
});
