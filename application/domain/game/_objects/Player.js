(class Player extends lib.game._objects.Player {
  constructor(data, { parent }) {
    super(data, { parent });
    this.broadcastableFields(['availableZones']);
    this.set({
      availableZones: [],
    });
  }
  /**
   * Ссылка на класс-наследник (для доступа ко внутренним методам класса и Game-а)
   * @returns {(import('application/domain/game/types.js')._objects.Player)}
   */
  self() {
    return this;
  }
  prepareBroadcastData({ data, player, viewerMode }) {
    const self = this.self();
    this.self().game();
    this.game();

    const bFields = this.broadcastableFields();
    let visibleId = this._id;
    let preparedData;
    if (!bFields) {
      preparedData = data;
    } else {
      preparedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) {
          if (key === 'availableZones' && player !== this) continue;
          preparedData[key] = value;
        }
      }
    }
    return { visibleId, preparedData };
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
