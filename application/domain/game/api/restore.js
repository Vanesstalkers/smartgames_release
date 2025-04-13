async (context, { deckType, gameType, gameId, needLoadGame }) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();

  if (user.gameId && user.gameId !== gameId) {
    lib.store.broadcaster.publishAction(`user-${userId}`, 'broadcastToSessions', {
      data: { message: 'Попытка восстановления завершенной игры.' },
    });
    return { status: 'error', logout: true };
  }

  const { playerId, viewerId } = user;
  const { lobbyId } = session;

  if (needLoadGame) {
    try {
      const game = await domain.game.load({ gameType, gameId, lobbyId });

      const joinData = { userId: user.id(), userName: user.name || user.login, playerId, viewerId };
      if (viewerId) await game.viewerJoin(joinData);
      else await game.playerJoin(joinData);
    } catch (err) {
      if (err === 'not_found') {
        user.set({ gameId: null, playerId: null });
        await user.saveChanges();
      } else {
        throw err;
      }
    }

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

  // сообщаем игроку о возврате в игру после обновления страницы в браузере
  await user.joinGame({ gameId, playerId, viewerId, deckType, gameType });

  return { status: 'ok' };
};
