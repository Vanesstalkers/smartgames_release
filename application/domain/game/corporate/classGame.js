(class CorporateGame extends domain.game.class {
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

  get(id) {
    return this.game().get(id);
  }

  find(code) {
    if (code.indexOf(this.code) !== 0) code = this.code + code;
    return this.game().find(code);
  }

  run(actionName, data, initPlayer) {
    const action =
      domain.game.corporate.actions?.[actionName] ||
      domain.game.actions?.[actionName] ||
      lib.game.actions?.[actionName];
    if (!action) throw new Error(`action "${actionName}" not found`);
    return action.call(this, data, initPlayer);
  }

  runSuper(actionName, data, initPlayer) {
    const action = domain.game.actions?.[actionName] || lib.game.actions?.[actionName];
    if (!action) throw new Error(`action "${actionName}" not found`);
    return action.call(this, data, initPlayer);
  }

  async dumpState() {
    return; // должна сохраняться только superGame
  }
});
