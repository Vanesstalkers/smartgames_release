async (context, { name } = {}) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const { gameId, playerId } = session;
  const game = lib.store('game').get(gameId);
  
  if (!game) throw new Error('Не участвует в игре');

  const playerTeamGame = game.get(playerId).game();
  playerTeamGame.set({ title: name });

  await game.saveChanges();
  return { status: 'ok' };
};
