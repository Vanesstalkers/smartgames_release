(function () {
  this.run('lib.roundStart');

  // делаем после обновления таймера в lib.roundStart, в частности из-за карты "time"
  this.playRoundStartCards();

  const player = this.roundActivePlayer();

  let message = "Новый раунд";
  if (!this.isSinglePlayer()) message += ". Ваш ход.";
  player.notifyUser({ message }, { hideTime: 3000 });
});
