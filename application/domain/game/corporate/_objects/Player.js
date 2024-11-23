(class Player extends domain.game._objects.Player {
  constructor() {
    super(...arguments);
    this.broadcastableFields(['teamlead']);
  }
  /**
   * Ссылка на класс-наследник (для доступа ко внутренним методам класса и Game-а)
   * @returns {(import('application/domain/game/corporate/types.js')._objects.Player)}
   */
  self() {
    return this;
  }
  z(){
    // this.self().game().
    this.game();
  }
});
