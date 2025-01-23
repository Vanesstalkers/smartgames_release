async (context, { round } = {}) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { gameId, lobbyId } = session;
  const game = lib.store('game').get(gameId);

  if (!game) throw new Error('Не участвует в игре');

  try {
    const { gameType } = game;
    const players = Object.values(game.store.player);

    round = parseInt(round);
    if (!round > 0) round = game.round;
    
    const query = { _gameid: db.mongo.ObjectID(game.id()), round };
    const [
      dumpData, // берем первый элемент, т.к. в ответе массив
    ] = await db.mongo.find(game.col() + '_dump', query, { limit: 1 });
    if (!dumpData) throw new Error('Копия для восстановления не найдена.');

    const subscribers = game.channel().subscribers.entries();
    for (const [subscriberChannel] of subscribers) {
      await lib.store.broadcaster.publishData(subscriberChannel, game.wrapPublishData(null));
    }
    await game.removeGame();

    const restoredGame = await domain.game.load({
      ...{ gameType, gameId, lobbyId },
      round,
    });
    restoredGame.restorationMode = true;

    for (const player of players) {
      const { userId, userName, _id: playerId } = player;
      const joinData = { userId, userName, playerId /* , viewerId */ };
      await restoredGame.playerJoin(joinData);

      const user = lib.store('user').get(userId);
      user.subscribe(`game-${gameId}`, { rule: 'actions-only' });
      for (const session of user.sessions()) {
        session.subscribe(`game-${gameId}`, {
          rule: 'vue-store',
          userId,
          viewerMode: user.viewerId ? true : false,
        });
        session.onClose.push(async () => {
          session.unsubscribe(`game-${gameId}`);
        });
      }
    }
    return { status: 'ok' };
  } catch (err) {
    console.log(err);
    context.client.emit('action/emit', {
      eventName: 'alert',
      data: { message: err.message, stack: err.stack },
    });

    return err;
  }
};
