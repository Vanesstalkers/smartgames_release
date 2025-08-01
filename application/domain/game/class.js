(class Game extends lib.game.class() {
  constructor() {
    super(...arguments);
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    const { Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide } = domain.game._objects;
    this.defaultClasses({ Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide });

    this.preventSaveFields(['decks']);
    this.preventBroadcastFields(['decks']);
  }
  
  stepLabel(label) {
    return `Раунд ${this.round} (${label})`;
  }
  
  removeTableCards() {
    const tableDecks = this.select({ className: 'Deck', attr: { placement: 'table' } });
    for (const deck of tableDecks) {
      deck.moveAllItems({ target: this.decks.drop, setData: { visible: false } });
    }
  }
  
  restorePlayersHands() {
    const { roundStepWinner } = this.rounds[this.round];
    for (const player of this.players()) {
      if (player === roundStepWinner) continue; // карты победителя сбрасываются
      player.returnTableCardsToHand();
    }
  }

  checkFieldIsReady() {
    const planeList = this.decks.table.getAllItems();
    const bridgeList = this.select({ className: 'Bridge', directParent: this });

    let ready = true;
    for (const releaseItem of [...planeList, ...bridgeList]) {
      if (!ready) continue;
      if (releaseItem.hasEmptyZones()) ready = false;
    }

    return ready;
  }
  checkCrutches() {
    let updatedMap = {};
    for (const diceSideId of Object.keys(this.crutchMap || {})) {
      const diceSide = this.get(diceSideId);
      const dice = diceSide.parent();
      const parentZone = dice.findParent({ className: 'Zone' });
      if (!parentZone) {
        updatedMap[diceSideId] = null;
        continue;
      }
      const parentZoneSide = parentZone.getSides().find(({ diceSideCode }) => diceSideCode === diceSide.code);

      let hasCrutch = false;
      if (parentZoneSide?.expectedValues) {
        for (const expectedValue of Object.keys(parentZoneSide.expectedValues)) {
          if (expectedValue.toString() !== diceSide.value.toString()) hasCrutch = true;
        }
      }
      if (hasCrutch === false) updatedMap[diceSideId] = null;
    }
    if (Object.keys(updatedMap).length) this.set({ crutchMap: updatedMap });
  }
  crutchCount() {
    return Object.keys(this.crutchMap || {}).length;
  }
  getFullPrice() {
    const planes = this.decks.table.getAllItems();
    const baseSum = planes.reduce((sum, plane) => sum + plane.price, 0);
    const timerMod = 30 / this.gameTimer;
    const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[this.gameConfig];
    return Math.floor(baseSum * timerMod * configMod);
  }
  addPlayer(data) {
    const { Player } = this.defaultClasses();
    return new Player(data, { parent: this });
  }
  getSmartRandomPlaneFromDeck({ sort = true } = {}) {
    const plane = this.find('Deck[plane]')
      .items()
      .sort(sort ? ({ portMap: a }, { portMap: b }) => {
        const al = Object.keys(a).length;
        const bl = Object.keys(b).length;
        return al === bl ? (Math.random() > 0.5 ? -1 : 1) : al < bl ? -1 : 1;
      } : () => Math.random() > 0.5 ? -1 : 1)
      .pop();

    if (!plane) this.run('endGame', { msg: { lose: 'В колоде закончились блоки игрового поля' } }); // проиграли все

    return plane;
  }
  countAvailableZones() {
    const planeList = this.decks.table.getAllItems();
    const bridgeList = this.select({ className: 'Bridge', directParent: this });

    let count = 0;
    for (const plane of planeList) {
      count += plane.select('Zone').filter((zone) => !zone.getItem()).length;
    }
    for (const bridge of bridgeList) {
      count += bridge.select('Zone').filter((zone) => !zone.getItem()).length;
    }
    return count;
  }
  countDicesInHands() {
    let count = 0;
    for (const player of this.players()) {
      count += player.select({ className: 'Dice', directParent: false }).length;
    }
    return count;
  }
  checkDiceResource() {
    const availableZonesCount = this.countAvailableZones();
    const dicesInHandCount = this.countDicesInHands();
    const dicesInDeck = this.find('Deck[domino]').itemsCount();

    if (availableZonesCount > dicesInDeck + dicesInHandCount) {
      return this.run('endGame', {
        msg: { lose: 'Оставшихся костяшек домино не достаточно, чтобы закрыть все свободные зоны игрового поля' },
      });
    }
  }
  playRoundStartCards() {
    if (!this.settings.allowedAutoCardPlayRoundStart) return;

    const card = this.decks.active.items()[0];
    if (!card) return;

    card.play({
      player: this.roundActivePlayer(),
      logMsg: `Активировано ежедневное событие <a>"${card.title}"</a>`,
    });
  }
  getDeletedDices() {
    const result = [];
    for (const zone of this.select('Zone')) {
      const item = zone.getDeletedItem();
      if (item) result.push(item);
    }
    return result;
  }
  addCardPlane(card) {
    const deck = this.find('Deck[plane]');

    const codeSfx = Math.random().toString().slice(-4);
    const plane = deck.addItem({
      sourceGameId: card.sourceGameId,
      _code: `event_${card.name}_${codeSfx}`,
      price: 50,
      release: true, // зон нет, и для всех проверок plane считается зарелиженным
      ...{ cardPlane: true, width: 120, height: 180 },
      customClass: ['card-plane', 'card-event', `card-${card.name}`],
      portList: [
        {
          ...{ _code: 1, links: [], t: 'any', s: 'core' },
          ...{ left: 22.5, top: 105, direct: { bottom: true } },
        },
      ],
    });

    return plane;
  }

  checkForRelease({ zone, player }) {
    const zoneParent = zone.parent();
    if (zoneParent.release) return; // РЕЛИЗ был активирован ранее
    if (zoneParent.hasEmptyZones()) return;

    zoneParent.set({ release: true });
    this.toggleEventHandlers('RELEASE', {}, player);
  }

  dropPlayedCards() {
    const playedCards = this.decks.active.select('Card');
    for (const card of playedCards) {
      if (!card.playOneTime) card.set({ played: null });
      card.moveToTarget(this.decks.drop);
      // card.markDelete();
    }
  }

  fieldIsBlocked() {
    return false;
  }

  hasDiceReplacementEvent() {
    return this.eventData.activeEvents.some(event => event.name === 'diceReplacementEvent');
  }

  initTableDiceAction({ dice, player } = {}) {
    const enabledTriggerEvent = player.triggerEventEnabled({ ignoreEvents: ['diceReplacementEvent'] });
    if (enabledTriggerEvent)
      throw new Error(`Игрок не может совершить это действие, пока не завершит активное событие (${enabledTriggerEvent.name})`);
  }
});
