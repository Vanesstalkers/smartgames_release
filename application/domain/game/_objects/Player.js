(// @ts-check
  /** @typedef {import('../types').Player} DomainPlayer */
  /** @typedef {import('../types').Game} DomainGame */
  /** @typedef {import('../types').GameObject} DomainGameObject */
  /** @typedef {import('../../lib/game/_objects/Player').Player} BasePlayer */
  /** @typedef {import('../../lib/game/_objects/Player').PlayerData} PlayerData */

  /**
   * Расширенная реализация игрока для доменной логики игры
   * @extends {BasePlayer}
   * @description Реализует специфичную для домена логику игрока:
   * - Управление доступными зонами для игрока
   * - Проверка лимитов карт/костяшек в руке
   * - Специфичные для домена правила и ограничения
   * 
   * @property {Object} eventData - Расширенные данные событий
   * @property {string[]} eventData.availableZones - Список доступных зон для игрока
   * @property {boolean} [eventData.disablePlayerHandLimit] - Флаг отключения лимита карт в руке
   * 
   * @property {string} userId - ID пользователя
   * @property {string} [avatarCode] - Код аватара
   * @property {Record<string, any>} [avatarsMap] - Карта аватаров
   * @property {boolean} active - Флаг активности
   * @property {boolean} ready - Флаг готовности
   * @property {number} [timerEndTime] - Время окончания таймера
   * @property {number} [timerUpdateTime] - Время обновления таймера
   * @property {Record<string, any>} [deckMap] - Карта колод
   * @property {Record<string, any>} [staticHelper] - Вспомогательные данные
   */
  class Player extends lib.game._objects.Player {
    /**
     * Создает экземпляр доменного игрока
     * @param {PlayerData} data - Данные для инициализации игрока
     * @param {{ parent: DomainGameObject }} options - Опции конфигурации
     * @description Инициализирует доменного игрока:
     * 1. Вызывает родительский конструктор
     * 2. Устанавливает начальные значения для доступных зон
     */
    constructor(data, { parent }) {
      super(data, { parent });
      this.set({ eventData: { availableZones: [] } }); // без предустановленного значения не будет работать реактивность на фронте (сразу после запуска игры)
    }
    /**
     * Проверяет лимит костяшек домино в руке игрока
     * @description Если количество костяшек превышает лимит:
     * 1. Проверяет флаг отключения лимита
     * 2. Если лимит не отключен, сбрасывает все костяшки в общую колоду
     * 3. Логирует информацию о сбросе костяшек
     * @throws {Error} Если не удалось найти колоду домино
     */
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
    /**
     * Возвращает ссылку на текущий экземпляр с правильным типом
     * @returns {this} Типизированная ссылка на текущий экземпляр
     * @description Используется для доступа к внутренним методам класса и Game с правильными типами
     */
    self() {
      return this;
    }
    // test() {
    //   /** @type {(import('application/domain/game/types.js')._objects.Player)} */
    //   const self = this;
    //   const g = self.game();
    // const g = this.game();
    // const pp = new domain.game._objects.Player();
    // const gg = pp.game();
    // const g = this.game();
    // }
  })
