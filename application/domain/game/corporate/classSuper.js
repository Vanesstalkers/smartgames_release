(class CorporateSuperGame extends domain.game.class {
  isSuperGame = true;
  gamesMap = {};
  roundPool = new lib.utils.circularArray();
  #dumps = {};

  constructor() {
    super(...arguments);

    Object.assign(this, {
      ...domain.game.corporate.decorators['@chat'].decorate(),
    });

    const { Bridge, Card, Dice, Plane, Player, TableSuper, Zone, ZoneSide } = domain.game.corporate._objects;
    this.defaultClasses({ Bridge, Card, Dice, Plane, Player, Table: TableSuper, Zone, ZoneSide });
  }

  select(query = {}) {
    if (typeof query === 'string') query = { className: query };
    if (query.sourceGameId) {
      if (!query.attr) query.attr = {};
      query.attr.sourceGameId = query.sourceGameId;
    }
    return super.select(query);
  }

  async create({ deckType, gameType, gameConfig, gameTimer, teamsCount, playerCount, maxPlayersInGame, gameRoundLimit } = {}) {
    const usedTemplates = [];

    if (!teamsCount?.val) throw new Error('Количество команд должно быть указано');

    playerCount = playerCount.val;

    usedTemplates.unshift(domain.game.configs.cardTemplates.random());
    await super.create(
      { deckType, gameType, gameConfig, gameTimer, templates: { card: usedTemplates[0] } },
      { initPlayerWaitEvents: false }
    );

    this.set({ teamsCount: teamsCount.val });
    this.set({ gameRoundLimit: gameRoundLimit });
    this.set({ settings: { planesAtStart: this.settings.planesNeedToStart } });
    this.set({ status: 'WAIT_FOR_PLAYERS', statusLabel: 'Ожидание игроков' });

    for (let _code = 1; _code <= this.teamsCount; _code++) {
      usedTemplates.unshift(domain.game.configs.cardTemplates.random({ exclude: usedTemplates }));
      const game = await new domain.game.corporate.classGame(
        { _code }, // storeData
        { parent: this } // gameObjectData
      ).create(
        {
          ...{ deckType, gameType, gameConfig, gameTimer },
          templates: { card: usedTemplates[0], code: `team${_code}` },
          playerMap: {}, // будут добавлены в playerJoin > getFreePlayerSlot
        },
        { initPlayerWaitEvents: false }
      );

      game.set({ title: `Команда №${_code}` });
      this.set({ gamesMap: { [game.id()]: {} } });
    }
    this.roundPool.add('common', this.getAllGames());
    await this.saveChanges();

    const initiatedGame = await db.redis.hget('games', this.id());
    if (!initiatedGame) await this.addGameToCache();

    return this;
  }

  restart() {
    this.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${this.round}`, restorationMode: null });
    this.run('initGameProcessEvents');

    if (this.gameConfig === 'competition') {
      for (const game of this.getAllGames()) {
        game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}`, roundReady: true });
        game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове
      }

      const games = this.roundPool.current({ fixState: true }); // в конце раунда будет вызов с loadFixedState
      for (const game of games) {
        lib.timers.timerRestart(game, game.lastRoundTimerConfig);
        game.playRoundStartCards({ enabled: true });
        game.set({ roundReady: false });
      }

      return;
    }

    const allGamesMerged = this.allGamesMerged();
    const roundActiveGame = allGamesMerged ? this.roundActiveGame() : null;

    const games = this.getAllGames();
    for (const game of games) {
      game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}` });
      game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове

      if (roundActiveGame && game !== roundActiveGame && !game.disabled) continue;

      lib.timers.timerRestart(game, game.lastRoundTimerConfig);

      if (!allGamesMerged) game.playRoundStartCards({ enabled: true });
    }

    if (allGamesMerged) this.playRoundStartCards(); // у superGame нет кастомного метода playRoundStartCards, так что можно не укаызвать { enabled: true }
  }

  prepareBroadcastData({ data = {}, userId, viewerMode }) {
    const broadcastData = super.prepareBroadcastData({ data, userId, viewerMode });

    if (data.game) {
      const gamesWithoutStore = Object.keys(data.game).reduce(
        (obj, item) => Object.assign(obj, { [item]: { store: null } }),
        {}
      );

      lib.utils.mergeDeep({
        target: broadcastData,
        source: { game: gamesWithoutStore },
      });
    }
    return broadcastData;
  }

  getFreePlayerSlot({ game } = {}) {
    const playerCount = this.players().length;
    if (this.maxPlayersInGame && playerCount >= this.maxPlayersInGame) return null;

    if (!game) game = this.getAllGames().sort((g1, g2) => g1.players().length - g2.players().length)[0];

    const player = game.run('addPlayer', {
      ...lib.utils.structuredClone(this.settings.playerTemplates['default']),
      _code: playerCount + 1,
    });

    return player;
  }

  async playerJoin({ userId, userName, teamId }) {
    try {
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена');

      const restoredPlayer = this.getPlayerByUserId(userId);
      const player = restoredPlayer || this.getFreePlayerSlot({ game: this.get(teamId) });
      if (!player) throw new Error('Свободных мест не осталось');

      const gameId = this.id();
      const playerId = player.id();
      const playerGame = player.game();

      player.set({ ready: true, userId, userName });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'joinGame', {
        gameId,
        playerId,
        deckType: this.deckType,
        gameType: this.gameType,
        isSinglePlayer: this.isSinglePlayer(),
      });

      if (restoredPlayer) {
        if (player.teamlead && !player.eventData.teamReady) playerGame.run('teamReady', {}, player);
        await this.saveChanges();
        return;
      }

      playerGame.set({ disabled: false, playerMap: { [playerId]: userId } });
      this.set({ gamesMap: { [player.gameId]: { [playerId]: userId } } });
      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      if (this.status === 'IN_PROCESS') {
        if (this.gameConfig === 'cooperative') {
          const turnOrder = this.turnOrder;
          if (playerGame.merged && !turnOrder.includes(playerGame.id())) {
            turnOrder.push(playerGame.id());
            this.set({ turnOrder });
          }
        }
        if (this.gameConfig === 'competition') {
          const roundPool = this.roundPool;
          if (!playerGame.merged) {
            const { data } = roundPool.get('common');
            if (!data.includes(playerGame)) {
              roundPool.update('common', data.concat(playerGame));
              roundPool.setActive('common', true);
            }
          } else {
            roundPool.setActive(playerGame.id(), true);
          }
        }
      }

      await this.saveChanges();
    } catch (exception) {
      console.error(exception);
      lib.store.broadcaster.publishAction.call(this, `user-${userId}`, 'broadcastToSessions', {
        data: { message: exception.message, stack: exception.stack },
      });
      lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'logout'); // инициирует hideGameIframe
    }
  }
  async removeGame(config) {
    for (const game of this.getAllGames()) {
      await game.removeGame(config);
    }
    await super.removeGame(config);
  }
  async playerLeave({ userId, viewerId }) {
    if (this.status !== 'FINISHED' && !viewerId) {
      this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
      try {

        const player = this.getPlayerByUserId(userId);
        this.run('processPlayerLeave', {}, player);

        await this.saveChanges();
      } catch (exception) {
        if (exception instanceof lib.game.endGameException) {
          await this.removeGame();
        } else throw exception;
      }
    }
    lib.store.broadcaster.publishAction.call(this, `gameuser-${userId}`, 'leaveGame', {});
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

  async handleAction({ name: eventName, gameId, data: eventData = {}, sessionUserId: userId }) {
    const player = this.getPlayerByUserId(userId);
    if (!player) throw new Error('player not found');
    if (player.teamlead && eventData.teamleadAction) {
      player.set({ eventData: { disableActivePlayerCheck: true, disableActionsDisabledCheck: true } });
    }

    if (!gameId) gameId = player.gameId;
    const game = lib.store('game').get(gameId);

    if (game.isSuperGame) super.handleAction(...arguments);
    else await game.handleAction(...arguments);
  }

  gamesCount() {
    return Object.values(this.gamesMap).length;
  }
  getAllGames(filter) {
    let result = Object.values(this.store.game);
    if (filter) {
      for (const [key, val] of Object.entries(filter)) {
        result = result.filter((obj) => obj[key] === val);
      }
    }
    return result;
  }
  allGamesRoundReady() {
    return this.getAllGames().find((game) => !game.roundReady) ? false : true;
  }
  allGamesMerged() {
    return this.getAllGames().find((game) => !game.merged) ? false : true;
  }
  allGamesFieldReady() {
    return this.getAllGames().find((game) => !game.checkFieldIsReady()) ? false : true;
  }

  async dumpState() {
    const clone = lib.utils.structuredClone(this);
    clone.roundPool = this.roundPool.toJSON();

    for (const [gameId, gameDump] of Object.entries(this.#dumps)) {
      clone.store.game[gameId] = gameDump;
      // store super-игры хранит в себе сущности всех игр, которые могли поменяться после создания dump-а (например, в playRoundStartCards)
      for (const [entityType, entities] of Object.entries(gameDump.store)) {
        for (const [entityId, entityData] of Object.entries(entities)) {
          clone.store[entityType][entityId] = entityData;
        }
      }
      Object.assign(clone.store.game[gameId], { eventData: { activeEvents: [] }, eventListeners: {} });
    }
    clone._gameid = db.mongo.ObjectID(clone._id);
    clone._dumptime = Date.now();
    delete clone._id;

    await db.mongo.insertOne(this.col() + '_dump', clone);
  }
  dumpChild(game) {
    this.#dumps[game._id] = lib.utils.structuredClone(game);
  }
  roundActiveGame(game) {
    if (game) this.set({ roundActiveGameId: game.id() });
    return this.get(this.roundActiveGameId);
  }
  selectNextActiveGame() {
    const roundActiveGame = this.roundActiveGame();

    if (
      // не будет установлен в первый раунд, когда все игры померджились
      roundActiveGame
    ) {
      const roundActivePlayer = roundActiveGame.roundActivePlayer();

      if (roundActivePlayer.eventData.extraTurn) {
        if (
          // актуально только для событий в течение хода игрока, инициированных не им самим
          roundActivePlayer.eventData.skipTurn ||
          roundActivePlayer.ready !== true // игрок мог выйти
        ) {
          roundActivePlayer.set({ eventData: { extraTurn: null, skipTurn: null } });
        } else {
          return roundActiveGame;
        }
      }
    }

    const games = this.turnOrder;
    const activeGameIndex = games.findIndex((gameId) => gameId === this.roundActiveGameId);
    const newActiveGameId = games[(activeGameIndex + 1) % games.length];
    const newActiveGame = this.get(newActiveGameId);
    this.roundActiveGame(newActiveGame);

    return newActiveGame;
  }
  roundActivePlayer(player) {
    if (player) this.set({ roundActivePlayerId: player.id() });
    return this.get(this.roundActiveGame()?.roundActivePlayerId);
  }

  checkDiceResource() {
    let availableZonesCount = this.countAvailableZones();
    let dicesInHandCount = 0;
    let dicesInDeck = 0;

    const games = this.getAllGames();
    for (const game of games) {
      availableZonesCount += game.countAvailableZones();
      dicesInHandCount += game.countDicesInHands();
      dicesInDeck += game.find('Deck[domino]').itemsCount();
    }

    const vacantIntergationZonesCount = games.filter((game) => !game.merged && !game.mergeInProgress).length;
    if (availableZonesCount + vacantIntergationZonesCount > dicesInDeck + dicesInHandCount) {
      for (const player of this.players()) {
        if (!player.teamlead) continue;
        player.notifyUser('Оставшихся костяшек домино не достаточно, чтобы закрыть все свободные зоны игрового поля. Попробуйте восстановить более ранние раунды игры.');
      }
    }
  }
  fieldIsBlocked() {
    return false;
  }
  broadcastEvent(handler, data) {
    for (const game of this.getAllGames()) {
      game.toggleEventHandlers(handler, data, game.roundActivePlayer());
    }
  }

  mergeStatus() {
    return null;
  }

  logs(data, config = {}) {
    if (!data) return super.logs(data, config);

    if (typeof data === 'string') data = { msg: data };
    if (!data.msg) {
      console.error('log msg is required', { data });
      return;
    }

    if (data.msg.includes('{{player}}')) {
      if (!data.userId) data.userId = this.roundActiveGame()?.roundActivePlayer()?.userId;
      const player = this.getPlayerByUserId(data.userId);
      const game = player?.game();
      data.msg = data.msg.replace(/{{player}}/g, `<player team="${game?.templates?.code || "central"}">${player?.userName || ''}</player>`);
    }
    return super.logs(data, config);
  }

  checkForRelease({ zone, player }) {
    const zoneParent = zone.parent();
    if (zoneParent.release) return; // РЕЛИЗ был активирован ранее
    if (zoneParent.hasEmptyZones()) return;

    let anchorGame = zoneParent.game();
    if (zoneParent.anchorGameId) anchorGame = lib.store('game').get(zoneParent.anchorGameId);
    if (this.gameConfig === 'competition') anchorGame = player.game();

    zoneParent.set({ release: true });

    anchorGame.toggleEventHandlers('RELEASE', { zone }, player);
  }
});
