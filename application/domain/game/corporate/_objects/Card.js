(class Card extends lib.game._objects.Card {
  constructor(data = {}) {
    super(...arguments);
    let { sourceGameId, anchorGameId } = data;
    if (!sourceGameId) sourceGameId = this.game().id();
    if (anchorGameId) this.game(lib.store('game').get(anchorGameId));
    this.set({ sourceGameId, anchorGameId });
    this.broadcastableFields(['sourceGameId', 'anchorGameId']);
  }
  sourceGame() {
    return lib.store('game').get(this.sourceGameId);
  }
  setAnchorGame(game) {
    if (game) {
      this.set({ anchorGameId: game.id() });
      this.game(game);
    }
  }
  moveToTarget(target) {
    const sourceGame = this.sourceGame();
    const targetGame = target.game();
    const superGame = sourceGame.isSuperGame ? sourceGame : sourceGame.game();

    const targetParent = target.parent();
    const targetCode = target.shortCode();

    if (targetGame !== sourceGame) this.setAnchorGame(targetGame);

    if (targetParent.is('Game')) {
      if (targetCode === 'Deck[card_drop]') {
        if (targetGame !== sourceGame) {
          // сброшенные карты возвращаем в исходную колоду
          target = sourceGame.find('Deck[card_drop]');
        }
      } else if (targetCode === 'Deck[card_active]' && targetGame !== superGame) {
        if (superGame.allGamesMerged()) {
          target = superGame.find('Deck[card_active]');
        }
      }
    } else if (targetParent.is('Player')) {
      if (targetCode === 'Deck[card]') {
        // рука игрока

        if (sourceGame.merged || sourceGame.isSuperGame) {
          // активирована общая рука команды

          if (targetGame !== sourceGame) {
            target = targetGame.find('Deck[card_common]');
          } else {
            target = sourceGame.find('Deck[card_common]');
          }
        }
      }
    }

    return super.moveToTarget(target);
  }
  getEvent(eventName) {
    if (!eventName) eventName = this.name;
    const event =
      domain.game.corporate.events?.card?.[eventName] ||
      domain.game.events?.card?.[eventName] ||
      lib.game.events?.card?.[eventName];
    if (!event) return null;
    return event();
  }
  play({ player, logMsg } = {}) {
    if (this.played) return;

    let game = player.game();
    const superGame = game.game();
    if (game.merged && superGame.allGamesMerged()) game = superGame;

    const event = this.initEvent(this.name, { game, player, allowedPlayers: [player] });
    if (event !== null && player) player.addEvent(event);
    this.set({ played: Date.now() });

    this.game().logs(logMsg || `Разыграна карта "${this.title}"`);
  }
});
