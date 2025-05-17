async ({ gameType, gameId, lobbyId, round }) => {
  const processData =
    gameType === 'corporate'
      ? async function (loadedData) {
        const corporateGame = this;
        corporateGame.set({ gamesMap: loadedData.gamesMap });
        corporateGame.restorationMode = true;
        corporateGame.run('fillGameData', { ...loadedData, playerMap: {} });
        corporateGame.set({ status: 'RESTORING_GAME', statusLabel: 'Восстановление игры' });

        const gamesMap = {};
        for (const gameId of Object.keys(loadedData.gamesMap)) {
          const gameData = loadedData.store.game[gameId];
          const game = await new domain.game.corporate.classGame(
            { id: gameData._id, _code: gameData.code }, // data
            { parent: corporateGame } // config
          ).load({ fromData: gameData }, { initStore: true });
          game.restorationMode = true;
          game.run('fillGameData', { ...gameData, playerMap: {} });
          gamesMap[gameId] = game;
        }


        for (const playerId of Object.keys(loadedData.playerMap)) {
          const playerData = this.store.player[playerId];
          const game = this.store.game[playerData.gameId];

          if (playerData.teamlead) delete playerData.eventData.teamReady;
          game.run('addPlayer', playerData);
        }

        const pool = loadedData.roundPool;
        for (const key of pool.keys) {
          const games = key === 'common' ? this.getAllGames().filter((g) => !pool.keys.includes(g.id())) : [this.get(key)];
          this.roundPool.add(key, games, { active: pool.items[key].active });
        }
        this.roundPool.setKey(pool.currentKey);
      }
      : function (loadedData) {
        const game = this;
        game.run('fillGameData', loadedData);
      };

  const query = { _id: gameId };
  if (round) query.round = round;
  const gameClassGetter = gameType === 'corporate' ? domain.game.corporate.classSuper : domain.game.class;
  return await new gameClassGetter({ id: gameId })
    .load({ fromDB: { id: gameId, query, processData, fromDump: true } })
    .then(async (game) => {
      const { deckType, gameType, gameConfig, gameTimer, playerMap } = game;
      await lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
        restorationMode: true,
        ...{ gameId, gameTimer, playerMap },
        ...{ deckType, gameType, gameConfig },
      });

      game.restorationMode = true;

      await game.updateGameAtCache({
        restorationMode: true,
        id: gameId,
        deckType,
        gameType,
        workerId: application.worker.id,
        port: application.server.port,
      });
      game.run('initPlayerWaitEvents');

      for (const player of game.players()) player.set({ ready: false });

      return game;
    })
    .catch((err) => {
      throw err;
    });
};
