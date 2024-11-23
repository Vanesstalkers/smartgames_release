async (context, { deckType, gameType, gameId, needLoadGame }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  if (user.gameId && user.gameId !== gameId) throw new Error('Уже подключен к другой игре');

  const { playerId, viewerId } = user;
  const { lobbyId } = session;

  if (needLoadGame) {
    // PIPELINE_GAME_RESTORE (4.4.1) :: восстанавливаем игру из БД (при входе любого первого игрока)
    const processData =
      gameType === 'corporate'
        ? async function (loadedData) {
            const corporateGame = this;
            corporateGame.set({ gamesMap: loadedData.gamesMap });
            corporateGame.run('fillGameData', loadedData);
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

        for (const player of game.players()) player.set({ ready: false });

        // PIPELINE_GAME_RESTORE (4.5 == 5) :: сообщаем восстановленной игре о появлении у нее нового игрока
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
    // PIPELINE_GAME_RESTORE (4.4.1) :: добавляем в восстановленную игру всех остальных игроков
    const game = lib.store('game').get(gameId);
    const joinData = { userId: user.id(), userName: user.name || user.login, playerId, viewerId };
    // PIPELINE_GAME_RESTORE (4.5 == 5) :: сообщаем восстановленной игре о появлении у нее нового игрока
    if (viewerId) await game.viewerJoin(joinData);
    else await game.playerJoin(joinData);
    return { status: 'ok' };
  }

  // PIPELINE_GAME_RESTORE (4.4.2 == 6) :: сообщаем игре игроку о возврате в игру после обновления страницы в браузере
  await user.joinGame({ gameId, playerId, viewerId, deckType, gameType });

  return { status: 'ok' };
};
