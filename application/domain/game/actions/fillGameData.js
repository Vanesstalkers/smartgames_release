(function (data) {
  const { configs } = domain.game;
  const { Dice, Plane, Table, Deck, Card } = this.defaultClasses();
  
  const newGame = data.newGame;

  if (data.store) this.store = data.store;
  this.logs(data.logs);

  this.deckType = data.deckType;
  this.gameType = data.gameType;
  this.gameConfig = data.gameConfig;
  this.gameTimer = data.gameTimer;
  this.addTime = data.addTime;
  this.settings = data.settings;
  this.status = data.status;
  this.statusLabel = data.statusLabel;
  this.round = data.round || 0;
  this.roundActivePlayerId = data.roundActivePlayerId;
  this.cardEvents = data.cardEvents || {};
  this.title = data.title;
  if (!data.templates) data.templates = { card: 'dark' }; // !!! заменить выбранный игроком шаблон
  this.templates = data.templates || { card: domain.game.configs.cardTemplates.random() };

  if (data.playerMap) {
    data.playerList = [];
    for (const _id of Object.keys(data.playerMap)) data.playerList.push(this.store.player[_id]);
  } else {
    data.playerList = data.settings.playerList;
  }
  for (const item of data.playerList || []) this.run('addPlayer', item);

  if (data.deckMap) {
    data.deckList = [];
    for (const _id of Object.keys(data.deckMap)) data.deckList.push(this.store.deck[_id]);
  } else {
    data.deckList = data.settings.deckList;
  }
  for (const item of data.deckList || []) {
    const deckClass = item.subtype === 'table' ? Table : Deck;
    const deckItemClass = item.type === 'domino' ? Dice : item.type === 'plane' ? Plane : Card;

    if (item.access === 'all') item.access = this.playerMap;
    this.addDeck(item, { deckClass, deckItemClass });
  }
  if (newGame) {
    const cardsToRemove = this.settings.cardsToRemove || [];
    for (const [deckCode, json] of [
      ['Deck[domino]', configs.dices()],
      ['Deck[card]', configs.cards().filter((card) => !cardsToRemove.includes(card.name))],
      ['Deck[plane]', configs.planes()],
    ]) {
      const deck = this.find(deckCode);
      const items = lib.utils.structuredClone(json);
      for (const item of items) deck.addItem(item);
    }
  }

  if (data.bridgeMap) {
    data.bridgeList = [];
    for (const _id of Object.keys(data.bridgeMap)) data.bridgeList.push(this.store.bridge[_id]);
  }
  for (const item of data.bridgeList || []) this.run('addBridge', item);

  this.clearChanges(); // игра запишется в БД в store.create
  return this;
});
