() => ({
  ...lib.game.tutorial.getHelperLinks(),
  readyBtn: {
    selector: '.player.iam .card-worker .ready-btn',
    displayForced: true,
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
});
