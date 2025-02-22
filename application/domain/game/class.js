(class Game extends lib.game.class() {
  constructor() {
    super(...arguments);
    Object.assign(this, {
      ...lib.chat['@class'].decorate(),
      ...lib.game.decorators['@hasDeck'].decorate(),
    });

    /* 
    !!!! добавить в release\node_modules\impress\lib\place.js 
      const files = await node.fsp.readdir(targetPath, { withFileTypes: true });

      files.sort((a, b) => {
        if (a.isFile() && !b.isFile()) return -1; // Если 'a' файл, а 'b' нет, то 'a' идет раньше
        if (!a.isFile() && b.isFile()) return 1; // Если 'a' не файл, а 'b' файл, то 'b' идет раньше
        return a.name.localeCompare(b.name);
      });
    */
    const { Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide } = domain.game._objects;
    this.defaultClasses({ Bridge, Dice, DiceSide, Plane, Player, Port, Table, Zone, ZoneSide });

    this.preventSaveFields(['decks']);
    this.preventBroadcastFields(['decks']);
  }
  restore() {
    super.restore();
    this.playRoundStartCards(); // делаем после обновления таймера (в super.restore), в частности из-за карты "time"
  }

  checkFieldIsReady() {
    const planeList = this.decks.table.getAllItems();
    const bridgeList = this.getObjects({ className: 'Bridge', directParent: this });

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
      const parentZoneSide = parentZone.sideList.find(({ diceSideCode }) => diceSideCode === diceSide.code);

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
  getSmartRandomPlaneFromDeck() {
    const plane = this.find('Deck[plane]')
      .getAllItems()
      .sort(({ portMap: a }, { portMap: b }) => {
        const al = Object.keys(a).length;
        const bl = Object.keys(b).length;
        return al === bl ? (Math.random() > 0.5 ? -1 : 1) : al < bl ? -1 : 1;
      })
      .pop();

    if (!plane) this.run('endGame', { message: 'В колоде закончились блоки игрового поля' }); // проиграли все

    return plane;
  }
  countAvailableZones() {
    const planeList = this.decks.table.getAllItems();
    const bridgeList = this.getObjects({ className: 'Bridge', directParent: this });

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
        message: 'Оставшихся костяшек домино не достаточно, чтобы закрыть все свободные зоны игрового поля',
      });
    }
  }
  playRoundStartCards() {
    if (!this.settings.allowedAutoCardPlayRoundStart) return;

    const card = this.decks.active.items()[0];
    if (!card) return;

    card.play({
      player: this.roundActivePlayer(),
    });
    this.logs(`Активировано ежедневное событие "${card.title}".`);
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

    // const codeSfx = (card.sourceGameId || Math.random().toString()).slice(-4);
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

  checkForRelease({ plane, player }) {
    if (plane.release) return; // РЕЛИЗ был активирован ранее
    if (plane.hasEmptyZones()) return;

    let anchorGame = plane.game();
    if (plane.anchorGameId) anchorGame = lib.store('game').get(plane.anchorGameId);

    plane.set({ release: true });

    anchorGame.toggleEventHandlers('RELEASE', {}, player);
  }

  dropPlayedCards() {
    const playedCards = this.decks.active.select('Card');
    for (const card of playedCards) {
      if (!card.playOneTime) card.set({ played: null });
      card.moveToTarget(this.decks.drop);
      // card.markDelete();
    }
  }
});
