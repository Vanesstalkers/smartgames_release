(class Player extends lib.game._objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.set({ eventData: { availableZones: [] } }); // без предустановленного значения не будет работать реактивность на фронте (сразу после запуска игры)
  }
  /**
   * Ссылка на класс-наследник (для доступа ко внутренним методам класса и Game-а)
   * @returns {(import('application/domain/game/types.js')._objects.Player)}
   */
  self() {
    return this;
  }
  triggerEventEnabled() {
    // /** @type {(import('application/domain/game/types.js')._objects.Player)} */
    // const self = this;
    // const g = self.game();
    // const g = this.game();
    // const pp = new domain.game._objects.Player();
    // const gg = pp.game();
    // const g = this.game();
    // gg.

    return this.eventData.activeEvents.find((event) => event.hasHandler('ADD_PLANE'));
  }
});
