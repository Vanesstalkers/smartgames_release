(class Player extends domain.game._objects.Player {
  constructor(data) {
    super(...arguments);
    this.set({ teamlead: data.teamlead });
    this.broadcastableFields(['teamlead']);
  }
  /**
   * Ссылка на класс-наследник (для доступа ко внутренним методам класса и Game-а)
   * @returns {(import('application/domain/game/corporate/types.js')._objects.Player)}
   */
  self() {
    return this;
  }
  game(game) {
    if (!game) return super.game();
    super.game(game);

    for (const deck of this.select({ className: 'Deck' })) {
      deck.game(game);
    }
  }
});
