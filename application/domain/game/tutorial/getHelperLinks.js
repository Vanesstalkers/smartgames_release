() => ({
  gameControls: {
    selector: '.game-controls',
    ...{ tutorial: 'game-tutorial-gameControls', simple: false },
    type: 'game',
    pos: { top: false, left: false },
  },
  handPlanes: {
    selector: '.session-player .player.iam.active .hand-planes .plane:last-child',
    ...{ tutorial: 'game-tutorial-handPlanes', simple: false },
    type: 'game',
    pos: { top: true, left: true },
  },
  gamePlane: {
    selector: '#game #gamePlane .plane',
    ...{ tutorial: 'game-tutorial-gamePlane', simple: false },
    type: 'game',
    pos: { top: true, left: true },
  },
  handDices: {
    selector: '.session-player .player.iam.active .hand-dices .domino-dice:first-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  handCards: {
    selector: '.session-player .player.iam.active .hand-cards .card-event:first-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  fieldZoneDouble: {
    selector: '#game #gamePlane .plane .zone.double',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  cardActive: {
    selector: '[code="Deck[card_active]"] .card-event',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: false, left: true },
  },
  leaveGame: {
    selector: '.leave-game-btn',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  addExtraBlock: {
    selector: '.plane.add-block-action',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
});
