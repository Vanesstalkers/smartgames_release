(class Game extends lib.game.class() {
  constructor() {
    super(...arguments);
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    this.defaultClasses({
      Player: domain.game._objects.Player,
      Deck: domain.game._objects.Deck,
      Card: domain.game._objects.Card,
    });
  }

  getFullPrice() {
    const baseSum = 1000; // TO_CHANGE (меняем на свою сумму дохода за игру)
    const timerMod = 30000 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  stepLabel(label) {
    return `Раунд ${this.round} (${label})`;
  }

  removeTableCards() {
    const tableDecks = this.select({ className: 'Deck', attr: { placement: 'table' } });
    for (const deck of tableDecks) {
      deck.moveAllItems({ toDrop: true, setData: { visible: false } });
    }
  }

  restorePlayersHands() {
    const { roundStepWinner } = this.rounds[this.round];
    for (const player of this.players()) {
      if (player === roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }
});
