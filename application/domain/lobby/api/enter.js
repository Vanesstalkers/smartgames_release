async (context, { lobbyId }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  const lobbyName = `lobby-${lobbyId}`;
  await session.subscribe(lobbyName, { rule: 'vue-store', userId: user.id() });

  session.onClose.push(async () => {
    if (session.lobbyId !== lobbyId) return; // уже вышел из лобби

    await session.unsubscribe(lobbyName);
    session.set({ lobbyId: null });
    await session.saveChanges();

    await user.leaveLobby({ sessionId, lobbyId });
  });
  await user.enterLobby({ sessionId, lobbyId });

  const { gameId, playerId, viewerId } = user;
  if (gameId) {
    let gameLoaded = await db.redis.hget('games', gameId);
    const isAlive = await lib.store.broadcaster.publishAction(`game-${gameId}`, 'isAlive');
    if(!isAlive){
      gameLoaded = false;
      await db.redis.hdel('games', gameId);
    }

    if (gameLoaded) {
      const { deckType } = JSON.parse(gameLoaded);

      session.set({ gameId, playerId, viewerId, lobbyId });
      await session.saveChanges();

      session.emit('joinGame', { deckType, gameId, restore: true });
    } else {
      if (!gameLoaded) {
        user.set({ gameId: null, playerId: null });
        await user.saveChanges();

        session.set({ lobbyId });
        for (const session of user.sessions()) {
          session.set({ gameId: null, playerId: null });
          await session.saveChanges();
        }
        return { status: 'ok' };

        // данная реализация восстанавливает игру с ошибкой
        // + не продуман сценарий восстановления игры для нескольких игроков
        await new domain.game.class()
          .load({ fromDB: { id: gameId } })
          .then(async (game) => {
            await lib.store.broadcaster.publishAction(lobbyName, 'addGame', { id: gameId });
            user.joinGame({ gameId, playerId });
            lib.timers.timerRestart(game);
          })
          .catch(async (err) => {
            if (err === 'not_found') {
              user.set({ gameId: null, playerId: null });
              await user.saveChanges();
            } else throw err;
          });
      }
    }
  } else {
    session.set({ lobbyId });
    await session.saveChanges();
  }

  return { status: 'ok' };
};
