(class Table extends domain.game._objects.Table {
  addItem(item) {
    const result = super.addItem(item);

    const game = this.game();
    game.store[result._col][result._id] = result;
    for (const obj of result.getAllObjects({ directParent: false })) {
      game.store[obj._col][obj._id] = obj;
    }

    return result
  }
  removeItem(itemToRemove) {
    super.removeItem(itemToRemove);

    const game = this.game();
    delete game.store[itemToRemove._col][itemToRemove._id];
    for (const obj of itemToRemove.getAllObjects({ directParent: false })) {
      delete game.store[obj._col][obj._id];
    }
  }
});
