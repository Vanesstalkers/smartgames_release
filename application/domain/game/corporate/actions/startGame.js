(function () {
  this.roundActivePlayer().deactivate();
  this.set({ roundReady: true });

  const corporateGame = this.game();
  if (!corporateGame.allGamesRoundReady()) return;

  for (const childGame of Object.values(corporateGame.store.game)) {
    childGame.run('domain.startGame');
  }
  corporateGame.run('initGameProcessEvents');
  corporateGame.set({ status: 'IN_PROCESS' });
});
