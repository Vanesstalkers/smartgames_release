() => ({
  ...lib.game.tutorial.getHelperLinks(),
  players: {
    selector: '.players .workers',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, right: true },
  },
  handPlanes: {
    selector: '.session-player .player.iam.active .hand-planes .plane:last-child',
    ...{ tutorial: 'game-tutorial-handPlanes', simple: false },
    type: 'game',
    pos: { top: true, left: true },
  },
  gamePlane: {
    selector: `
      #game:not([type="corporate"]) #gamePlane .plane, 
      #game[type="corporate"] #gamePlane .plane.anchor-team-field
    `,
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
  diceControls: {
    selector: `
      #game:not([type="corporate"]) #gamePlane .plane .domino-dice,
      #game[type="corporate"] #gamePlane .plane.anchor-team-field .domino-dice
    `,
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
  iamCardToggle: {
    selector: '.session-player .player.iam .iam-card-toggle',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  fieldZoneDouble: {
    selector: `
      #game:not([type="corporate"]) #gamePlane .plane .zone.double,
      #game[type="corporate"] #gamePlane .plane.anchor-team-field .zone.double
    `,
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
  addExtraBlock: {
    selector: '.plane.add-block-action',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  teamsBlock: {
    selector: '.players .games .game-item:last-child',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, right: true },
  },
  teamsReadyBtn: {
    selector: '.team-ready-btn',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
  teamLead: {
    selector: '.player.iam .card-worker.teamlead >.teamlead-icon',
    tutorial: 'game-tutorial-links',
    type: 'game',
    pos: { top: true, left: true },
  },
});
