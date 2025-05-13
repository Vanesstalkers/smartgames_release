(class CorporateSuperGame extends domain.game.class {
  isSuperGame = true;
  gamesMap = {};
  roundPool = new lib.utils.circularArray();
  #dumps = {};

  constructor() {
    super(...arguments);
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

  async create({ deckType, gameType, gameConfig, gameTimer, playerCount, maxPlayersInGame } = {}) {
    const {
      utils: { structuredClone: clone },
    } = lib;
    const {
      [gameType]: {
        //
        items: { [gameConfig]: settings },
      } = {},
    } = domain.game.configs.gamesFilled();
    const usedTemplates = [];

    if (!playerCount?.val || !maxPlayersInGame?.val) throw 'player_count_not_exists';

    playerCount = playerCount.val;

    usedTemplates.unshift(domain.game.configs.cardTemplates.random());
    await super.create(
      { deckType, gameType, gameConfig, gameTimer, templates: { card: usedTemplates[0] } },
      { initPlayerWaitEvents: false }
    );
    this.set({ playerCount });
    this.set({ settings: { planesAtStart: this.settings.planesNeedToStart } });

    for (let _code = 1; _code <= playerCount; _code++) {
      this.run('addPlayer', {
        ...clone(settings.playerTemplates['default']),
        _code,
      });
    }
    this.run('initPlayerWaitEvents');
    this.decks.table.set({ access: this.playerMap });
    this.decks.active.set({ access: this.playerMap });

    const fullPlayersList = Object.values(this.store.player);
    const gamesMap = {};
    for (let _code = 1; _code <= Math.ceil(playerCount / maxPlayersInGame.val); _code++) {
      usedTemplates.unshift(domain.game.configs.cardTemplates.random({ exclude: usedTemplates }));
      const game = await new domain.game.corporate.classGame(
        { _code }, // storeData
        { parent: this } // gameObjectData
      ).create(
        {
          ...{ deckType, gameType, gameConfig, gameTimer },
          templates: { card: usedTemplates[0], code: `team${_code}` },
        },
        { initPlayerWaitEvents: false }
      );

      const players = fullPlayersList.splice(0, maxPlayersInGame.val);
      players[0].set({ teamlead: true });

      let active = true;
      const playerMap = Object.fromEntries(players.map(p => [p._id, {}]));
      for (const player of players) {
        player.updateParent(game);
        player.game(game);
        if (active) {
          player.set({ active });
          active = false;
        }
        player.find('Deck[plane]').set({ access: playerMap });
      }
      game.set({ playerMap, title: `Команда №${_code}` });

      if (players.length === 1) game.set({ settings: { singlePlayer: true } });
      game.decks.table.set({ access: this.playerMap });
      game.decks.active.set({ access: this.playerMap });
      game.find('Deck[domino_common]').set({ access: playerMap, markNew: true });
      game.find('Deck[card_common]').set({ access: playerMap, markNew: true });

      gamesMap[game.id()] = Object.fromEntries(players.map((player) => [player.id(), {}]));
    }
    this.set({ gamesMap });
    this.roundPool.add('common', this.getAllGames());
    await this.saveChanges();

    const initiatedGame = await db.redis.hget('games', this.id());
    if (!initiatedGame) await this.addGameToCache();

    return this;
  }

  restore() {
    this.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${this.round}` });
    this.run('initGameProcessEvents');

    if (this.gameConfig === 'competition') {
      for (const game of this.getAllGames()) {
        game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}`, roundReady: true });
        game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове
      }

      const games = this.roundPool.current({ fixState: true }); // в конце раунда будет вызов с loadFixedState
      for (const game of games) {
        lib.timers.timerRestart(game, game.lastRoundTimerConfig);
        game.playRoundStartCards();
        game.set({ roundReady: false });
      }

      return;
    }

    const allGamesMerged = this.allGamesMerged();
    const roundActiveGame = allGamesMerged ? this.roundActiveGame() : null;

    for (const game of this.getAllGames()) {
      game.set({ status: 'IN_PROCESS', statusLabel: `Раунд ${game.round}` });
      game.run('initGameProcessEvents'); // из "лишних" событий ADD_PLANE отключится при первом же вызове

      if (roundActiveGame && game !== roundActiveGame) continue;

      lib.timers.timerRestart(game, game.lastRoundTimerConfig);

      if (!allGamesMerged) game.playRoundStartCards();
    }

    if (allGamesMerged) this.playRoundStartCards();
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

  async playerJoin({ userId, userName }) {
    try {
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена');

      const player = this.restorationMode ? this.getPlayerByUserId(userId) : this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');

      const gameId = this.id();
      const playerId = player.id();

      player.set({ ready: true, userId, userName });
      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      const gamesMap = this.gamesMap;
      for (const [gameId, players] of Object.entries(gamesMap)) {
        if (players[playerId]) players[playerId] = userId;
      }
      this.set({ gamesMap });

      // инициатором события был установлен первый player в списке, который совпадает с активным игроком на старте игры
      this.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId }, player);
      await this.saveChanges();

      lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'joinGame', {
        gameId,
        playerId,
        deckType: this.deckType,
        gameType: this.gameType,
        isSinglePlayer: this.isSinglePlayer(),
        checkTutorials: true,
      });
    } catch (exception) {
      console.error(exception);
      lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
        data: { message: exception.message, stack: exception.stack },
      });
      lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'logout'); // инициирует hideGameIframe
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
    lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'leaveGame', {});
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
          roundActivePlayer.eventData.skipTurn
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

    for (const game of this.getAllGames()) {
      availableZonesCount += game.countAvailableZones();
      dicesInHandCount += game.countDicesInHands();
      dicesInDeck += game.find('Deck[domino]').itemsCount();
    }

    if (availableZonesCount > dicesInDeck + dicesInHandCount) {
      for (const player of this.players()) {
        if (!player.teamlead) continue;

        const data = {
          message:
            'Оставшихся костяшек домино не достаточно, чтобы закрыть все свободные зоны игрового поля. Попробуйте восстановить более ранние раунды игры.',
        };
        lib.store.broadcaster.publishAction(`gameuser-${player.userId}`, 'broadcastToSessions', { data });
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
});
