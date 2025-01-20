(class Zone extends lib.game.GameObject {
  itemMap = {};

  constructor(data, { parent }) {
    super(data, { col: 'zone', parent });
    this.broadcastableFields(['_id', 'sideList', 'itemMap', 'left', 'top', 'vertical', 'double']);

    const { left = 0, top = 0, vertical, double } = data;
    this.set({ left, top, vertical, double });

    const ZoneSide = this.game().defaultClasses()['ZoneSide'];
    if (data.sideList) {
      const store = this.game().getStore();
      this.set({
        sideList: [
          new ZoneSide(store.zoneside[data.sideList[0]._id], { parent: this }),
          new ZoneSide(store.zoneside[data.sideList[1]._id], { parent: this }),
        ],
      });
    } else {
      this.set({
        sideList: [
          new ZoneSide({ _code: 1, value: data[0] }, { parent: this }),
          new ZoneSide({ _code: 2, value: data[1] }, { parent: this }),
        ],
      });
    }

    const itemMap = {};
    if (data.itemMap) {
      data.itemList = [];
      for (const _id of Object.keys(data.itemMap)) {
        data.itemList.push(this.getStore().dice[_id]);
      }
    }
    for (let item of data.itemList || []) {
      const itemClass = this.getItemClass();
      // !!! странная конструкция (с присваиванием item) - надо перепроверить
      if (item.constructor != itemClass) item = new itemClass(item, { parent: this });
      itemMap[item._id] = {};
    }
    this.set({ itemMap });
  }
  customObjectCode() {
    return this.default_customObjectCode(...arguments);
  } // иначе подставится метод из Deck

  getItemClass() {
    return this.game().defaultClasses()['Dice'];
  }
  addItem(item, { force = false } = {}) {
    const itemClass = this.getItemClass();
    const newObjectCreation = item.constructor != itemClass ? true : false;

    if (newObjectCreation) item = new itemClass(item, { parent: this });

    const available = this.checkIsAvailable(item);
    if (available || force) {
      if (!newObjectCreation) item.setParent(this);
      this.set({ itemMap: { [item._id]: {} } });
      if (available === 'rotate') item.set({ sideList: [...item.sideList.reverse()] });
      this.updateValues();
    }

    return available;
  }
  /**
   * устанавливает value зоны в соответствии с размещенным в нем dice
   */
  updateValues() {
    const item = this.getItem();
    this.sideList.forEach((side, sideIndex) => {
      if (item) {
        const itemSide = item.sideList[sideIndex];
        side.set({ value: itemSide.value, diceSideCode: itemSide.code });
      } else {
        side.set({ value: null, diceSideCode: null });
      }
      // обновляем expectedValues у всех соседей
      for (const linkId of Object.keys(side.links)) {
        this.game().get(linkId).updateExpectedValues();
      }
    });
  }
  getNearZones() {
    const game = this.game();
    const zones = [];
    for (const side of this.sideList) {
      for (const linkCode of Object.values(side.links)) {
        zones.push(game.find(linkCode).getParent());
      }
    }
    return zones;
  }
  removeItem(itemToRemove) {
    this.set({ itemMap: { [itemToRemove._id]: null } });
    this.updateValues();
  }
  getItem() {
    return this.select('Dice').find((dice) => !dice.deleted);
  }
  getDeletedItem() {
    return this.select('Dice').find((dice) => dice.deleted);
  }
  checkIsAvailable(dice, { skipPlacedItem } = {}) {
    if (!skipPlacedItem && this.getItem()) return false; // zone уже занята

    if (this.findParent({ className: 'Player' }) !== null) return false; // это plane в руке player

    const expectedValues0 = this.sideList[0].expectedValues;
    const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
    const expectedValues1 = this.sideList[1].expectedValues;
    const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

    const bridgeParent = this.findParent({ className: 'Bridge' });
    if (bridgeParent !== null) {
      if (bridgeParent.bridgeToCardPlane) {
        if (!(sizeOfExpectedValues0 || sizeOfExpectedValues1)) return false; // для card-bridge-zone должна быть заполнена zone прилегающего plane
      } else if (!sizeOfExpectedValues0 || !sizeOfExpectedValues1) {
        return false; // для bridge-zone должны быть заполнены соседние zone
      }
    }

    if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true; // соседние zone свободны

    if (
      (!sizeOfExpectedValues0 || (expectedValues0[dice.sideList[0].value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[dice.sideList[1].value] && sizeOfExpectedValues1 === 1))
    )
      return true;
    if (
      (!sizeOfExpectedValues0 || (expectedValues0[dice.sideList[1].value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[dice.sideList[0].value] && sizeOfExpectedValues1 === 1))
    )
      return 'rotate';

    return false;
  }
  checkItemCanBeRotated() {
    const expectedValues0 = this.sideList[0].expectedValues;
    const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
    const expectedValues1 = this.sideList[1].expectedValues;
    const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

    if (this.getParent().constructor.name === 'Bridge') return false;
    if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true;
    return false;
  }
});
