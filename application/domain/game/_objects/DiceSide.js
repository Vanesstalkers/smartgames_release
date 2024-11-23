(class DiceSide extends lib.game.GameObject {
  constructor(data, { parent }) {
    super(data, { col: 'diceside', parent });
    this.broadcastableFields(['_id', 'value', 'eventData']);

    const { value } = data;
    this.set({ value });
  }
  prepareBroadcastData({ data, player, viewerMode }) {
    let visibleId = this._id;
    let preparedData = {};
    const bFields = this.broadcastableFields();
    let fake = false;
    const dice = this.getParent();
    const diceParent = dice.getParent();
    if (diceParent.matches({ className: 'Deck' })) {
      if (!diceParent.access[player?._id] && !dice.visible && !viewerMode) {
        fake = true;
        visibleId = this.fakeId[diceParent.id()];
      }
    }
    if (!fake) {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) preparedData[key] = value;
      }
    }
    return { visibleId, preparedData };
  }
});
