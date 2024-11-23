async (context, { deckType, gameType, gameConfig, gameTimer, playerCount, maxPlayersInGame }) => {
  const { sessionId, userId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  if (!lobbyId) throw new Error('lobby not found'); // этой ошибки быть не должно - оставил проверку для отладки

  const gameClassGetter = gameType === 'corporate' ? domain.game.corporate.classSuper : domain.game.class;
  const game = await new gameClassGetter().create({
    ...{ deckType, gameType, gameConfig, gameTimer },
    ...{ playerCount, maxPlayersInGame },
  });
  const gameId = game.id();

  for (const session of user.sessions()) {
    // на случай повторного вызова api до обработки playerJoin
    // (session.saveChanges будет выполнен в user.joinGame)
    session.set({ gameId });
  }

  // PIPELINE_GAME_START (5) :: делаем публикацию о появлении у игры нового игрока (создателя игры)
  lib.store.broadcaster.publishAction(`game-${gameId}`, 'playerJoin', {
    userId,
    userName: user.name || user.login,
    userAvatar: user.avatarCode,
  });

  lib.store.broadcaster.publishAction(`lobby-${lobbyId}`, 'addGame', {
    gameId,
    creator: { userId: user.id(), tgUsername: user.tgUsername },
    ...{ deckType, gameType, gameConfig, gameTimer, playerMap: game.playerMap },
  });

  return { status: 'ok', gameId };
};
