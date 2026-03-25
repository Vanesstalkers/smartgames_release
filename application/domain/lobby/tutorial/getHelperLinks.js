() => ({
  ...lib.lobby.tutorial.getHelperLinks(),
  menuGamePoker: {
    selector: '.game-block .select-btn.corporate',
    tutorial: 'lobby-tutorial-menuGameCorporate',
    simple: false,
    type: 'lobby',
  },
});
