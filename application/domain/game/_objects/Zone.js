(class Zone extends lib.game.GameObject {
  itemMap = {};

  constructor(data, { parent }) {
    super(data, { col: 'zone', parent });
    this.broadcastableFields(['_id', 'sideList', 'itemMap', 'left', 'top', 'vertical', 'double']);

    const { left = 0, top = 0, vertical, double } = data;
    this.set({ left, top, vertical, double });

    const store = this.game().getStore();
    const ZoneSide = this.game().defaultClasses()['ZoneSide'];

    if (data.sideList) {
      new ZoneSide(store.zoneside[data.sideList[0]], { parent: this });
      new ZoneSide(store.zoneside[data.sideList[1]], { parent: this });
      this.set({ sideList: data.sideList });
    } else {
      const side0 = new ZoneSide({ _code: 1, value: data[0] }, { parent: this });
      const side1 = new ZoneSide({ _code: 2, value: data[1] }, { parent: this });
      this.set({ sideList: [side0.id(), side1.id()] });
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
      const newObjectCreation = item.constructor != itemClass ? true : false;
      // dice может быть либо в колоде, либо выложен на игровое поле - создание нового объекта актуально при восстановлении игры
      if (newObjectCreation) item = new itemClass(item, { parent: this });
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

    const { status } = this.checkIsAvailable(item);
    if (status || force) {
      if (!newObjectCreation) item.setParent(this);
      this.set({ itemMap: { [item._id]: {} } });
      if (status === 'rotate') item.set({ sideList: [...item.sideList.reverse()] });
      this.updateValues();
    }

    return status;
  }
  /**
   * устанавливает value зоны в соответствии с размещенным в нем dice
   */
  updateValues() {
    const item = this.getItem();
    this.getSides().forEach((side, sideIndex) => {
      if (item) {
        const itemSide = item.getSides(sideIndex);
        side.set({ value: itemSide.value, diceSideCode: itemSide.code });
      } else {
        side.set({ value: null, diceSideCode: null });
      }
      // обновляем expectedValues у всех соседей
      for (const linkSideId of Object.keys(side.links)) {
        this.game().get(linkSideId).updateExpectedValues();
      }
    });
  }
  getNearZones() {
    const game = this.game();
    const zones = [];
    for (const side of this.getSides()) {
      for (const linkSideId of Object.keys(side.links)) {
        zones.push(game.get(linkSideId).getParent());
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
    if (!skipPlacedItem && this.getItem()) return { status: false, msg: 'Зона уже занята.' };

    if (this.findParent({ className: 'Player' }) !== null)
      return { status: false, msg: 'Нельзя заполнять блоки в руке.' };

    const [side0, side1] = this.getSides();
    const expectedValues0 = side0.expectedValues;
    const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
    const expectedValues1 = side1.expectedValues;
    const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

    const bridgeParent = this.findParent({ className: 'Bridge' });
    if (bridgeParent !== null) {
      if (bridgeParent.bridgeToCardPlane) {
        if (!(sizeOfExpectedValues0 || sizeOfExpectedValues1))
          return { status: false, msg: 'Должна быть заполнена прилегающая к интеграции зона.' };
      } else if (!sizeOfExpectedValues0 || !sizeOfExpectedValues1) {
        return { status: false, msg: 'Должны быть заполнены прилегающие к интеграции зоны.' };
      }
    }

    if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return { status: true }; // соседние zone свободны

    const [diceSide0, diceSide1] = dice.getSides();
    if (
      (!sizeOfExpectedValues0 || (expectedValues0[diceSide0.value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[diceSide1.value] && sizeOfExpectedValues1 === 1))
    )
      return { status: true };
    if (
      (!sizeOfExpectedValues0 || (expectedValues0[diceSide1.value] && sizeOfExpectedValues0 === 1)) &&
      (!sizeOfExpectedValues1 || (expectedValues1[diceSide0.value] && sizeOfExpectedValues1 === 1))
    )
      return { status: 'rotate' };

    return { status: false };
  }
  checkItemCanBeRotated() {
    const [side0, side1] = this.getSides();
    const expectedValues0 = side0.expectedValues;
    const sizeOfExpectedValues0 = Object.keys(expectedValues0).length;
    const expectedValues1 = side1.expectedValues;
    const sizeOfExpectedValues1 = Object.keys(expectedValues1).length;

    if (this.isBridgeZone()) return false;
    if (!sizeOfExpectedValues0 && !sizeOfExpectedValues1) return true;
    return false;
  }
  isBridgeZone() {
    return this.parent().matches({ className: 'Bridge' });
  }

  /**
   * Возвращает объекты ZoneSide из store
   * @param {number} [index] - если указан, возвращает конкретную сторону по индексу
   * @returns {Array|Object} массив сторон или конкретную сторону
   */
  getSides(index) {
    const store = this.game().getStore();
    const sides = this.sideList.map(id => store.zoneside[id]);
    return typeof index === 'number' ? sides[index] : sides;
  }
});
