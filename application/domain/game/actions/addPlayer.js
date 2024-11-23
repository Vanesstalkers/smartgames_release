(function (data) {
  const store = this.getStore();
  const { Player, Card, Dice, Plane } = this.defaultClasses();
  const player = new Player(data, { parent: this });
  this.set({ playerMap: { [player._id]: {} } });

  if (data.deckMap) {
    data.deckList = [];
    for (const _id of Object.keys(data.deckMap)) data.deckList.push(store.deck[_id]);
  }
  for (const item of data.deckList || []) {
    const deckItemClass = item.type === 'domino' ? Dice : item.type === 'plane' ? Plane : Card;

    item.access = { [player._id]: {} };
    player.addDeck(item, { deckItemClass });
  }

  return player;
});
