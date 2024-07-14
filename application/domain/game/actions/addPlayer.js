(function (data) {
  // /** @type {(import('application/domain/game/types.js').default)} */
  // const self = this;

  const store = this.getStore();
  const { Player: playerClass } = this.defaultClasses();
  const player = new playerClass(data, { parent: this });
  this.set({ playerMap: { [player._id]: {} } });

  if (data.deckMap) {
    data.deckList = [];
    for (const _id of Object.keys(data.deckMap)) data.deckList.push(store.deck[_id]);
  }
  for (const item of data.deckList || []) {
    /**
     * @type {(
     *  import('application/domain/game/types.js').objects.Dice
     * |import('application/domain/game/types.js').objects.Plane
     * |import('application/lib/game/types.js').objects.Card
     * )}
     * */
    const deckItemClass =
      item.type === 'domino'
        ? domain.game.objects.Dice
        : item.type === 'plane'
        ? domain.game.objects.Plane
        : lib.game.objects.Card;

    item.access = { [player._id]: {} };
    player.addDeck(item, { deckItemClass });
  }

  return player;
});
