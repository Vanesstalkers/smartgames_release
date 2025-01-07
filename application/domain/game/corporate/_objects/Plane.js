(class Plane extends domain.game._objects.Plane {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
  }
  setParent(parent) {
    const currentParent = this.parent();
    super.setParent(parent);
    if (!currentParent) return; // тут первичное создание объекта
    const newParentGame = parent.game();
    if (newParentGame !== currentParent.game()) {
      for (const obj of this.getAllObjects()) {
        obj.game(newParentGame);
      }
    }
  }
  moveToTarget(target) {
    const currentParent = this.parent();
    super.moveToTarget(target);
    const newParentGame = target.game();
    if (newParentGame !== currentParent.game()) {
      this.game(newParentGame);
    }
  }
});
