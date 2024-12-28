(class CorporateSuperGame extends domain.game.class {
  isSuperGame = true;
  gamesMap = {};
  #dumps = {};

  constructor() {
    super(...arguments);
    const { Card, Dice, Plane, Player, Table, ZoneSide } = domain.game.corporate._objects;
    this.defaultClasses({ Card, Dice, Plane, Player, Table, ZoneSide });
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

    if (!playerCount?.val || !maxPlayersInGame?.val) throw new Error('Не указано количество игроков.');

    playerCount = playerCount.val;

    usedTemplates.unshift(domain.game.configs.cardTemplates.random());
    await super.create(
      { deckType, gameType, gameConfig, gameTimer, cardTemplate: usedTemplates[0] },
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

    const fullPlayersList = Object.values(this.store.player);
    const gamesMap = {};
    for (let _code = 1; _code <= Math.ceil(playerCount / maxPlayersInGame.val); _code++) {
      usedTemplates.unshift(domain.game.configs.cardTemplates.random({ exclude: usedTemplates }));
      const game = await new domain.game.corporate.classGame(
        { _code }, // storeData
        { parent: this } // gameObjectData
      ).create(
        { deckType, gameType, gameConfig, gameTimer, teamCode: _code, cardTemplate: usedTemplates[0] },
        { initPlayerWaitEvents: false }
      );

      const players = fullPlayersList.splice(0, maxPlayersInGame.val);
      players[0].set({ teamlead: true });

      let active = true;
      const playerMap = {};
      for (const player of players) {
        player.updateParent(game);
        player.game(game);
        if (active) {
          player.set({ active });
          active = false;
        }
        playerMap[player.id()] = {};
      }

      game.set({ playerMap, title: `Команда №${game.teamCode}` });

      if (players.length === 1) game.set({ settings: { singlePlayer: true } });
      game.decks.table.set({ access: this.playerMap });
      game.find('Deck[domino_common]').set({ access: playerMap, markNew: true });
      game.find('Deck[card_common]').set({ access: playerMap, markNew: true });

      gamesMap[game.id()] = Object.fromEntries(players.map((player) => [player.id(), {}]));
    }
    this.set({ gamesMap });
    await this.saveChanges();

    const initiatedGame = await db.redis.hget('games', this.id());
    if (!initiatedGame) await this.addGameToCache();

    return this;
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
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена.');

      const player = this.restorationMode
        ? this.players().find((player) => player.userId === userId)
        : this.getFreePlayerSlot();

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
      });
    } catch (exception) {
      console.error(exception);
      lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
        data: { message: exception.message, stack: exception.stack },
      });
      lib.store.broadcaster.publishAction(`gameuser-${userId}`, 'logout'); // инициирует hideGameIframe
    }
  }

  async playerLeave({ userId, viewerId }) {
    if (this.status !== 'FINISHED' && !viewerId) {
      this.logs({ msg: `Игрок {{player}} вышел из игры.`, userId });
      try {
        this.run('endGame', { canceledByUser: userId });
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

  async handleAction({ name: eventName, data: eventData = {}, sessionUserId: userId }) {
    const player = this.players().find((player) => player.userId === userId);
    if (!player) throw new Error('player not found');

    const gameId = Object.entries(this.gamesMap).find(([gameId, players]) => players[player.id()])[0];
    const game = lib.store('game').get(gameId);

    await game.handleAction(...arguments);
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

  async dumpState() {
    const clone = lib.utils.structuredClone(this);
    for (const [gameId, gameDump] of Object.entries(this.#dumps)) {
      clone.store.game[gameId] = gameDump;
    }
    await db.mongo.deleteOne(this.col() + '_dump', { _id: this.id() });
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

    const gamesList = this.getAllGames();
    const activeGameIndex = gamesList.findIndex((game) => game === roundActiveGame);
    const newActiveGame = gamesList[(activeGameIndex + 1) % gamesList.length];
    this.roundActiveGame(newActiveGame);

    return newActiveGame;
  }
});
