(class CorporateGame extends domain.game.class {
  hasSuperGame = true;

  constructor(storeData, gameObjectData) {
    super(storeData, gameObjectData);
    const { merged, roundReady } = storeData;
    this.set({ teamCode: storeData._code, merged, roundReady });
    this.defaultClasses({
      ...this.game().defaultClasses(),
      Table: domain.game._objects.Table,
    });
  }

  set(val, config = {}) {
    if (!this._col) throw new Error(`set error ('_col' is no defined)`);

    let clonedConfig = {};
    if (Object.keys(config).length > 0) {
      clonedConfig = lib.utils.structuredClone(config);
      if (clonedConfig.reset) {
        clonedConfig.reset = config.reset.map((key) => `store.${this._col}.${this._id}.${key}`);
      }
    }
    this.game().setChanges({ store: { game: { [this.id()]: val } } }, clonedConfig);
    lib.utils.mergeDeep({
      ...{ masterObj: this, target: this, source: val },
      config: { deleteNull: true, ...clonedConfig }, // удаляем ключи с null-значением
    });
  }

  setChanges(val, config) {
    this.game().setChanges(val, config);
  }
  markNew(obj, { saveToDB = false } = {}) {
    const { _col: col, _id: id } = obj;
    if (saveToDB) {
      this.game().setChanges({ store: { [col]: { [id]: obj } } });
    } else {
      this.game().addBroadcastObject({ col, id });
    }
  }
  markDelete(obj, { saveToDB = false } = {}) {
    const { _col: col, _id: id } = obj;
    if (saveToDB) {
      this.game().setChanges({ store: { [col]: { [id]: null } } });
    } else {
      this.game().deleteBroadcastObject({ col, id });
    }
  }
  async saveChanges() {
    await this.game().saveChanges();
  }

  get(id) {
    return this.game().get(id);
  }

  find(code) {
    if (code.indexOf(this.code) !== 0) code = this.code + code;
    return this.game().find(code);
  }

  run(actionPath, data, initPlayer) {
    const [actionName, actionDir] = actionPath.split('.').reverse();

    let action;
    if (actionDir) {
      if (actionDir === 'domain') action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    } else {
      action = domain.game.corporate.actions?.[actionName];
      if (!action) action = domain.game.actions?.[actionName];
      if (!action) action = lib.game.actions?.[actionName];
    }

    if (!action) throw new Error(`action "${actionName}" not found`);

    return action.call(this, data, initPlayer);
  }

  dumpState() {
    const clone = lib.utils.structuredClone(this);
    this.game().dumpChild(clone);
  }
  addPlayer(data) {
    const { Player } = this.defaultClasses();
    return new Player(data, { parent: this });
  }
  activate({ setData, publishText } = {}) {
    this.set({ active: true, activeReady: false, eventData: { actionsDisabled: null } });
    if (setData) this.set(setData);
  }

  checkFieldIsReady() {
    const planeList = this.merged
      ? this.game().decks.table.select({ className: 'Plane', attr: { sourceGameId: this.id() } })
      : this.decks.table.getAllItems();
    const bridgeList = this.merged
      ? this.game().select({ className: 'Bridge', attr: { sourceGameId: this.id() } })
      : this.getObjects({ className: 'Bridge', directParent: this });

    let ready = true;
    for (const releaseItem of [...planeList, ...bridgeList]) {
      if (!ready) continue;
      if (!releaseItem.release) ready = false;
    }

    return ready;
  }

  getDeletedDices() {
    const result = [];
    const zones = this.select('Zone');
    zones.push(...this.game().select('Zone')); // core game
    for (const zone of zones) {
      const item = zone.getDeletedItem();
      if(item) result.push(item);
    }
    return result;
  }
});
