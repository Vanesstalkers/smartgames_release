async (context, { round } = {}) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { gameId, lobbyId } = session;
  const game = lib.store('game').get(gameId);

  if (!game) throw new Error('Не участвует в игре');

  const { gameType } = game;
  const players = Object.values(game.store.player);

  const subscribers = game.channel().subscribers.entries();
  for (const [subscriberChannel] of subscribers) {
    await lib.store.broadcaster.publishData(subscriberChannel, game.wrapPublishData(null));
  }

  await game.removeGame();
  const restoredGame = await domain.game.load({
    ...{ gameType, gameId, lobbyId },
    round: parseInt(round),
  });
  restoredGame.restorationMode = true;

  for (const player of players) {
    const { userId, userName, _id: playerId } = player;
    const joinData = { userId, userName, playerId /* , viewerId */ };
    await restoredGame.playerJoin(joinData);
    // if (viewerId) await game.viewerJoin(joinData);
    // else await game.playerJoin(joinData);

    const user = lib.store('user').get(userId);
    user.subscribe(`game-${gameId}`, { rule: 'actions-only' });
    for (const session of user.sessions()) {
      session.subscribe(`game-${gameId}`, {
        rule: 'vue-store',
        userId,
        viewerMode: user.viewerId ? true : false,
      });
      session.onClose.push(async () => {
        // проверка на последнего игрока не нужна, потому что игра автоматически завершится через allowedAutoCardPlayRoundStart раундов

        session.unsubscribe(`game-${gameId}`);
      });
    }
  }
  return { status: 'ok' };
};
