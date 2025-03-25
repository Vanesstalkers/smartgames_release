(function (data, player) {
  const joinPlane = this.get(data.joinPortId).parent();

  this.run('domain.putPlaneOnField', data, player);
  
  const newGame = joinPlane.game();
  if (newGame.isSuperGame) {
    joinPlane.game(newGame.store.game[joinPlane.anchorGameId]); // в domain.putPlaneOnField выставилась superGame - меняем обратно
  }
});
