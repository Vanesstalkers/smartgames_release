(function ({ card, player, game: gameContext }) {
  if (!card || !player) return;

  const game = gameContext || this;
  try {
    const {
      helper: { getTutorial },
      utils: { structuredClone: clone },
    } = lib;

    const user = lib.store('user').get(player.userId);
    if (!user) return;

    const { steps } = getTutorial('game-tutorial-links');
    const tutorial = clone(steps, { convertFuncToString: true });
    const helperStep = tutorial.releaseCard;

    if (!helperStep) return;

    const cardGame = typeof card.game === 'function' ? card.game() : game;
    const templateCode = cardGame?.templates?.card || game.templates.card;
    const group = card.group || '';
    const name = card.name || '';
    const title = card.title || '';

    const baseUrl = lib.lobby?.__gameServerConfig?.serverUrl || '';
    const imgPath = `${baseUrl}/img/cards/${templateCode}/${group}/${name}.jpg`;

    helperStep.img = imgPath;
    if (helperStep.text) {
      helperStep.text = helperStep.text.replace('[[card-title]]', title);
    }

    player.updateUser({ helper: helperStep }).catch((err) => console.error(err));
  } catch (e) {
    console.error(e);
  }
});
