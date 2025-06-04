(class CorporateGame extends domain.game.class {
  hasSuperGame = true;
  #relatedEvents = new Set();

  constructor(storeData, gameObjectData) {
    super(storeData, gameObjectData);
    const { merged, roundReady, disabled = false } = storeData;
    this.set({ merged, roundReady, disabled });
    this.defaultClasses({
      ...this.game().defaultClasses(),
      Table: domain.game.corporate._objects.Table,
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

  get(id, { directParent = false } = {}) {
    const obj = this.game().get(id);
    return directParent && obj.game() !== this ? null : obj;
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

  async handleAction({ name: eventName, data: eventData = {}, sessionUserId: userId }) {
    try {
      const player = this.game().getPlayerByUserId(userId) || this.roundActivePlayer();
      if (!player) throw new Error('player not found');

      const activePlayers = this.game().getActivePlayers();
      const { disableActivePlayerCheck, disableActionsDisabledCheck } = player.eventData;
      if (!activePlayers.includes(player) && eventName !== 'leaveGame' && !disableActivePlayerCheck)
        throw new Error('Игрок не может совершить это действие, так как сейчас не его ход');
      else if (
        player.eventData.actionsDisabled &&
        !disableActionsDisabledCheck &&
        eventName !== 'roundEnd' &&
        eventName !== 'leaveGame'
      )
        throw new Error('Игрок не может совершать действия в этот ход');

      if (disableActivePlayerCheck || disableActionsDisabledCheck) {
        player.set({ eventData: { disableActivePlayerCheck: null, disableActionsDisabledCheck: null } });
      }

      if (this[eventName]) {
        this[eventName](eventData, player);
      } else {
        this.run(eventName, eventData, player);
      }

      await this.saveChanges();
    } catch (exception) {
      if (exception instanceof lib.game.endGameException) {
        await this.removeGame();
      } else {
        console.error(exception);
        lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'broadcastToSessions', {
          data: { message: exception.message, stack: exception.stack },
        });
        await this.saveChanges();
      }
    }
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
      : this.select({ className: 'Bridge', directParent: this });

    let ready = true;
    for (const releaseItem of [...planeList, ...bridgeList]) {
      if (!ready) continue;
      if (releaseItem.hasEmptyZones()) ready = false;
    }

    return ready;
  }

  getDeletedDices() {
    const result = [];
    const zones = this.select('Zone');
    if (this.merged) zones.push(...this.game().select('Zone')); // core game
    for (const zone of zones) {
      const item = zone.getDeletedItem();
      if (item) result.push(item);
    }
    return result;
  }

  checkDiceResource() {
    this.game().checkDiceResource();
  }

  isSinglePlayer() {
    return false;
  }

  fieldIsBlocked() {
    const superGame = this.game();
    if (superGame.status === 'RESTORING_GAME') return true;
    if (this.eventData.activeEvents?.find(e => e.name === 'initGameFieldsMerge')) return true;

    if (this.gameConfig === 'cooperative') {
      const mergeStatus = this.mergeStatus();
      return (this.roundReady && mergeStatus !== 'merged') || mergeStatus === 'freezed';
    }

    if (this.gameConfig === 'competition') {
      if (this.roundReady && !this.merged) {
        // у смердженной игры раунды обособенны от других игр - при очищении стола конфликта не возникнет
        return true;
      }
      return false;
    }

    return false;
  }
  mergeStatus() {
    const superGame = this.game();
    if (this.gameConfig === 'competition') return this.merged ? 'merged' : '';
    return this.merged ? (superGame.allGamesMerged() ? 'merged' : 'freezed') : '';
  }

  relatedEvents({ add, remove } = {}) {
    if (add) this.#relatedEvents.add(add);
    if (remove) this.#relatedEvents.delete(remove);
    return this.#relatedEvents;
  }

  playRoundStartCards({ enabled } = {}) {
    if (!enabled) return;
    super.playRoundStartCards();
  }

  hasDiceReplacementEvent() {
    const game = this.merged ? this.game() : this;
    return game.eventData.activeEvents.some(event => event.name === 'diceReplacementEvent');
  }

  logs(data, config = {}) {
    if (!data) return super.logs(data, config);

    if (typeof data === 'string') data = { msg: data };
    if (!data.userId) data.userId = this.roundActivePlayer()?.userId;
    return this.game().logs(data, config);
  }

  getTeamlead() {
    return this.players().find(p => p.teamlead);
  }

  renameTeam({ title }) {
    this.set({ title });
  }

  getSmartRandomPlaneFromDeck({ forceSearch = false } = {}) {
    if (this.gameConfig === 'cooperative') return super.getSmartRandomPlaneFromDeck();

    {
      // this.gameConfig === 'competition'

      const tablePlanesCount = this.decks.table.itemsCount();
      const expectedZonesCount = tablePlanesCount === 0 ? 4 : tablePlanesCount === 1 ? 3 : 2;

      const planes = this.find('Deck[plane]').items().filter((p) => p.zonesCount() === expectedZonesCount);

      // вызов с forceSearch делается в putPlaneOnFieldRecursive - если не вернуть вообще никакое поле, то игра завершится с ошибкой (можно повторить, если выставить большой planesToChoose в конфигах игры)
      if (planes.length === 0 && forceSearch) return super.getSmartRandomPlaneFromDeck();

      return planes[Math.floor(Math.random() * planes.length)];
    }
  }

  initTableDiceAction({ dice, player }) {
    super.initTableDiceAction({ dice, player });

    if (this.gameConfig === 'competition') {
      const zone = dice.parent();
      const zoneParent = zone.parent();
      if (zoneParent.anchorGameId && zoneParent.anchorGameId !== player.gameId)
        throw new Error('Игроку запрещено взаимодействовать с костяшками на столе чужой команды');
    }
  }

  checkForRelease({ zoneParent, player }) {
    this.game().checkForRelease({ zoneParent, player });
  }
  selectNextActivePlayer() {
    const roundActivePlayer = this.roundActivePlayer();
    const newActivePlayer = super.selectNextActivePlayer();
    return newActivePlayer || roundActivePlayer; // в команде могло не остаться игроков после их удаления - возвращаем последнего активного игрока, чтобы отработал END_ROUND
  }

  countDicesInHands() {
    let count = 0;
    for (const player of this.players()) {
      count += player.select({ className: 'Dice', directParent: false }).length;
    }
    count += this.find('Deck[domino_common]').itemsCount();
    return count;
  }
});
