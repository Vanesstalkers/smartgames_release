(class CorporateSuperGame extends domain.game.class {
  gamesMap = {};
  async create({ deckType, gameType, gameConfig, gameTimer, playerCount } = {}) {
    const {
      utils: { structuredClone: clone },
    } = lib;

    await super.create({ deckType, gameType, gameConfig, gameTimer });
    this.set({ playerCount });

    for (let _code = 1; _code <= playerCount; _code++) {
      this.run('addPlayer', {
        ...clone(this.settings.playerTemplates['default']),
        _code,
      });
    }
    this.run('initPlayerWaitEvents');

    const fullPlayersList = Object.values(this.store.player);
    const gamesMap = {};
    for (let _code = 1; _code <= playerCount; _code++) {
      const game = await new domain.game.corporate.classGame(
        { _code }, // data
        { parent: this } // config
      ).create({ deckType, gameType, gameConfig, gameTimer });

      const players = fullPlayersList.splice(0, 1);

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
      game.set({ playerMap });
      if (players.length === 1) game.set({ settings: { singlePlayer: true } });
      game.decks.table.set({ access: this.playerMap });
      game.run('initPlayerWaitEvents');

      gamesMap[game.id()] = Object.fromEntries(players.map((player) => [player.id(), {}]));
    }
    this.set({ gamesMap });
    await this.saveChanges();

    const initiatedGame = await db.redis.hget('games', this.id());
    if (!initiatedGame) await this.addGameToCache();

    return this;
  }

  async playerJoin({ userId, userName }) {
    try {
      if (this.status === 'FINISHED') throw new Error('Игра уже завершена.');

      const player = this.getFreePlayerSlot();
      if (!player) throw new Error('Свободных мест не осталось');
      const gameId = this.id();
      const playerId = player.id();

      player.set({ ready: true, userId, userName });
      this.logs({ msg: `Игрок {{player}} присоединился к игре.`, userId });

      const gamesMap = this.gamesMap;
      for (const [gameId, players] of Object.entries(gamesMap)) {
        if (players[playerId]) {
          players[playerId] = userId;
          const game = this.get(gameId);
          game.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId }, [player]);
        }
      }
      this.set({ gamesMap });

      // инициатором события был установлен первый player в списке, который совпадает с активным игроком на старте игры
      this.toggleEventHandlers('PLAYER_JOIN', { targetId: playerId });
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

  run(actionName, data, initPlayer) {
    const action =
      domain.game.corporate.actions?.[actionName] ||
      domain.game.actions?.[actionName] ||
      lib.game.actions?.[actionName];
    if (!action) throw new Error(`action "${actionName}" not found`);
    return action.call(this, data, initPlayer);
  }

  async handleAction({ name: eventName, data: eventData = {}, sessionUserId: userId }) {
    const player = this.players().find((player) => player.userId === userId);
    if (!player) throw new Error('player not found');

    const gameId = Object.entries(this.gamesMap).find(([gameId, players]) => players[player.id()])[0];
    const game = lib.store('game').get(gameId);

    await game.handleAction(...arguments);
    await this.saveChanges();
  }
});
