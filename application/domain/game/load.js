async ({ gameType, gameId, lobbyId, round }) => {
  const processData =
    gameType === 'corporate'
      ? async function (loadedData) {
        const corporateGame = this;
        corporateGame.set({ gamesMap: loadedData.gamesMap });
        corporateGame.run('fillGameData', loadedData);
        const gamesMap = {};
        for (const gameId of Object.keys(loadedData.gamesMap)) {
          const gameData = loadedData.store.game[gameId];
          const game = await new domain.game.corporate.classGame(
            { _id: gameData._id, _code: gameData.code }, // data
            { parent: corporateGame } // config
          ).load({ fromData: gameData }, { initStore: true });
          game.restorationMode = true;
          game.run('fillGameData', gameData);
          game.clearEvents(); // тут сохраненные в БД eventListeners (пустые объекты) - у corporateGame их нет, т.к. там отрабатывает preventSaveFields
          gamesMap[gameId] = game;
        }
        {
          // при создании super-игры, к которой привязаны plane-ы и bridge-ы из смердженных игр, эти игры еще не созданы (не получится прокинуть ссылку на них)
          for (const plane of corporateGame.decks.table.items()) {
            if (plane.anchorGameId) plane.game(gamesMap[plane.anchorGameId]);
          }
          for (const bridge of corporateGame.getObjects({ className: 'Bridge', directParent: false })) {
            if (bridge.anchorGameId) bridge.game(gamesMap[bridge.anchorGameId]);
          }
        }
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
        ...{ id: gameId, gameTimer, playerMap },
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
