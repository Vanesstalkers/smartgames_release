(class Card extends lib.game._objects.Card {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    this.set({ sourceGameId });
    this.broadcastableFields(['sourceGameId']);
  }
  moveToTarget(target) {
    const game = this.game();

    if (game.hasSuperGame && game.merged) {
      if (target.type === 'card' && !target.subtype && target.parent().matches({ className: 'Player' })) {
        target = game.find('Deck[card_common]');
      }
    }

    return super.moveToTarget(target);
  }
});
