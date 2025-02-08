(function () {
  const player = this.roundActivePlayer();
  const deck = player.find('Deck[plane]');
  const gameDeck = this.find('Deck[plane]');

  const plane = gameDeck.getRandomItem();
  if (!plane) throw new Error('В колоде закончились блоки');
  plane.moveToTarget(deck);
  plane.set({ eventData: { extraPlane: true } });
  plane.markNew(); // у игроков в хранилище нет данных об этом plane
});
