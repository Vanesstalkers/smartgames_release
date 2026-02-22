(function () {
  this.run('lib.roundStart');

  // делаем после обновления таймера в lib.roundStart, в частности из-за карты "time"
  this.playRoundStartCards();
  // this.dumpState(); нельзя вызвать тут, до тех пор пока не будет механизма активации слушателей событий карт

  const player = this.roundActivePlayer();

  let message = `Новый раунд`;
  if (!this.isSinglePlayer()) message += '. Ваш ход.';
  player.notifyUser({ message }, { hideTime: 3000, hideIcon: true });
});
