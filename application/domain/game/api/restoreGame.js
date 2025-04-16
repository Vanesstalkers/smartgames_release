async (context, { round } = {}) => {
  const { sessionId } = context.session.state;
  const { gameId, lobbyId } = lib.store('session').get(sessionId);
  const game = lib.store('game').get(gameId);

  if (!game) throw new Error('Не участвует в игре');

  try {
    const { gameType } = game;
    const [dumpData] = await db.mongo.find(
      game.col() + '_dump',
      { _gameid: db.mongo.ObjectID(game.id()), round: parseInt(round) || game.round },
      { limit: 1 }
    );

    if (!dumpData) throw new Error('Копия для восстановления не найдена.');

    // Очистка текущей игры
    for (const [channel] of game.channel().subscribers.entries()) {
      await lib.store.broadcaster.publishData(channel, game.wrapPublishData(null));
    }
    game.clearChanges(); // внутри removeGame вызовется saveChanges, так что очищаем лишнее, чтобы не поломать state на фронте
    await game.removeGame({ preventDeleteDumps: true });

    // Восстановление игры
    const restoredGame = await domain.game.load({ gameType, gameId, lobbyId, round: parseInt(round) || game.round });
    restoredGame.restorationMode = true;

    // Восстановление игроков и зрителей
    for (const player of [...Object.values(game.store.player), ...Object.values(game.store.viewer || {})]) {
      const { userId, userName, _id: id } = player;
      const user = lib.store('user').get(userId);
      user.subscribe(`game-${gameId}`, { rule: 'actions-only' });

      await (player.isViewer ?
        restoredGame.viewerJoin({ userId, userName, viewerId: id }) :
        restoredGame.playerJoin({ userId, userName, playerId: id }));

      for (const session of user.sessions()) {
        session.subscribe(`game-${gameId}`, {
          rule: 'vue-store',
          userId,
          ...(player.isViewer && { viewerMode: true })
        });
        session.onClose.push(async () => session.unsubscribe(`game-${gameId}`));
      }
    }

    return { status: 'ok' };
  } catch (err) {
    console.log(err);
    context.client.emit('action/emit', {
      eventName: 'alert',
      data: { message: err.message, stack: err.stack }
    });
    return err;
  }
};
