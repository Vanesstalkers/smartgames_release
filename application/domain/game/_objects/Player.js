(class Player extends lib.game._objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.set({ eventData: { availableZones: [] } }); // без предустановленного значения не будет работать реактивность на фронте (сразу после запуска игры)
  }
  checkHandDiceLimit() {
    const game = this.game();
    const hand = this.find('Deck[domino]');

    if (hand.itemsCount() > game.settings.playerHandLimit) {
      // слишком много доминошек в руке
      if (this.eventData.disablePlayerHandLimit) {
        this.set({ eventData: { disablePlayerHandLimit: null } });
      } else {
        hand.moveAllItems({
          target: game.find('Deck[domino]'),
        });

        game.logs({
          msg: `У игрока {{player}} превышено максимальное количество костяшек в руке на конец хода. Все его костяшки сброшены в колоду.`,
          userId: this.userId,
        });
      }
    }
  }
})