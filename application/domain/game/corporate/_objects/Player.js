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
  toggleEventWithTriggerListener(data = {}) {
    if (data.targetId) {
      data.target = this.game().game().get(data.targetId);
      // не удаляем data.targetId, т.к. внутри может быть fakeId
    }
    return super.toggleEventWithTriggerListener(data);
  }

  checkHandDiceLimit() {
    const game = this.game();
    if (!game.merged) {
      super.checkHandDiceLimit();
    } else {
      const gameCommonDominoDeck = game.find('Deck[domino_common]');

      if (gameCommonDominoDeck.itemsCount() > game.settings.playerHandLimit * game.players().length) {
        // слишком много dice в руке
        if (this.eventData.disablePlayerHandLimit) {
          this.set({ eventData: { disablePlayerHandLimit: null } });
        } else {
          gameCommonDominoDeck.moveAllItems({ target: game.find('Deck[domino]') });

          game.logs({
            msg: `У команды <team team="${game.templates.code}">${game.title}</team> превышено максимальное количество костяшек в руке на конец хода. Все костяшки сброшены в колоду.`,
          });
        }
      }
    }
  }
});
