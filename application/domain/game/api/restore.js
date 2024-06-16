async (context, { deckType, gameType, gameId, needLoadGame }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  if (user.gameId && user.gameId !== gameId) throw new Error('Уже подключен к другой игре');

  const { playerId, viewerId } = user;
  const { lobbyId } = session;

  if (needLoadGame) {
    const processData =
      gameType === 'corporate'
        ? async function (loadedData) {
            const corporateGame = this;
            corporateGame.set({ gamesMap: loadedData.gamesMap });
            corporateGame.run('fillGameData', loadedData);
            corporateGame.run('initPlayerWaitEvents');
            for (const gameId of Object.keys(loadedData.gamesMap)) {
              const gameData = loadedData.store.game[gameId];
              const game = await new domain.game.corporate.classGame(
                { _id: gameData._id, _code: gameData.code }, // data
                { parent: corporateGame } // config
              ).load({ fromData: gameData }, { initStore: true });
              game.restorationMode = true;
              game.run('fillGameData', gameData);
              game.clearEvents(); // тут сохраненные в БД eventListeners (пустые объекты) - у corporateGame их нет, т.к. там отрабатывает preventSaveFields
              game.run('initPlayerWaitEvents');
            }
          }
        : function (loadedData) {
            const game = this;
            game.run('fillGameData', loadedData);
          };

    const gameClassGetter = gameType === 'corporate' ? domain.game.corporate.classSuper : domain.game.class;
    await new gameClassGetter({ id: gameId })
      .load({ fromDB: { id: gameId, processData, fromDump: true } })
      .then(async (game) => {
        const { deckType, gameType, gameConfig, gameTimer, playerMap } = game;
        await lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
          ...{ id: gameId, gameTimer, playerMap },
          ...{ deckType, gameType, gameConfig },
        });

        game.restorationMode = true;
        await game.updateGameAtCache({ restorationMode: true });
        game.run('initPlayerWaitEvents');

        const joinData = { userId: user.id(), userName: user.name || user.login, playerId, viewerId };
        if (viewerId) await game.viewerJoin(joinData);
        else await game.playerJoin(joinData);
      })
      .catch(async (err) => {
        if (err === 'not_found') {
          user.set({ gameId: null, playerId: null });
          await user.saveChanges();
        } else throw err;
      });

    return { status: 'ok' };
  }

  const { restorationMode } = await db.redis.hget('games', gameId, { json: true });
  if (restorationMode) {
    const game = lib.store('game').get(gameId);
    const joinData = { userId: user.id(), userName: user.name || user.login, playerId, viewerId };
    if (viewerId) await game.viewerJoin(joinData);
    else await game.playerJoin(joinData);
    return { status: 'ok' };
  }

  await user.joinGame({ gameId, playerId, viewerId, deckType, gameType });

  return { status: 'ok' };
};
