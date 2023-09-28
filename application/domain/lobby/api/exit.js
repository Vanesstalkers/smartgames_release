async (context) => {
  const { sessionId } = context.session.state;
  const session = lib.store('session').get(sessionId);
  const user = session.user();
  const { lobbyId } = session;

  await session.unsubscribe(`lobby-${lobbyId}`);
  session.set({ lobbyId: null });
  await session.saveChanges();

  await user.leaveLobby({ sessionId, lobbyId });

  return { status: 'ok' };
};
