(function ({ card } = {}) {
  const eventGetter = this.gameType === 'corporate' && domain.game.corporate?.events?.card?.[card.name];
  return lib.game.tutorial.cardTutorialGenerator.call(this, { card, eventGetter });
});
