(function ({ winningPlayer, canceledByUser, msg } = {}) {
  const superGame = this.game();
  if (superGame.status !== 'IN_PROCESS') canceledByUser = true; // можно отменить игру, еще она еще не начата (ставим true, чтобы ниже попасть в условие cancel-ветку)

  superGame.set({ statusLabel: 'Игра закончена', status: 'FINISHED' });

  // делается после, чтобы можно было в END_ROUND-обработчике сделать проверку на FINISHED-статус
  for (const game of superGame.getAllGames()) {
    lib.timers.timerDelete(game);
    const activePlayer = game.roundActivePlayer();
    if (activePlayer) game.toggleEventHandlers('END_ROUND', {}, activePlayer);
    /* 
    * хз зачем это
    *  
    // for (const player of game.players()) {
    //   player.set({ eventData: { plane: null } });
    // }
    */
  }
  lib.timers.timerDelete(superGame);
  const activePlayer = superGame.roundActivePlayer();
  superGame.toggleEventHandlers('END_ROUND', {}, activePlayer);

  if (msg) superGame.logs(`Игра закончилась по причине: "${JSON.stringify(msg)}"`);

  if (winningPlayer) {
    const winningTeam = winningPlayer.game();
    superGame.set({ winUserId: winningPlayer.userId, winTeamId: winningTeam.id() });
    superGame.logs(`Команда <team team="${winningTeam.templates.code}">${winningTeam.title}</team> победила в игре.`);
  }

  const playerEndGameStatus = {};
  for (const player of superGame.players({ readyOnly: false })) {
    const { userId } = player;
    const endGameStatus = canceledByUser
      ? userId === canceledByUser
        ? 'lose'
        : 'cancel'
      : superGame.winTeamId // у игры есть победитель
      ? superGame.winTeamId === player.gameId || superGame.gameConfig === 'cooperative'
        ? 'win'
        : 'lose'
      : 'lose'; // игра закончилась автоматически
    player.set({ endGameStatus });
    playerEndGameStatus[userId] = endGameStatus;
  }

  superGame.set({ playerEndGameStatus });

  superGame.checkCrutches();
  superGame.broadcastAction('gameFinished', {
    corporateGame: true,
    gameId: superGame.id(),
    gameType: superGame.deckType,
    playerEndGameStatus: superGame.playerEndGameStatus,
    fullPrice: superGame.getFullPrice(),
    roundCount: superGame.round,
    crutchCount: superGame.crutchCount(),
    msg,
  });

  throw new lib.game.endGameException();
});
