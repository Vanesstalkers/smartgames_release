(function ({ initPlayer } = {}) {
  if (initPlayer) initPlayer.deactivate();
  if (!this.checkAllPlayersFinishRound()) return; // ждем завершения хода всеми игроками
  this.run('domain.startNewRound');
  this.set({ roundReady: false });
});
