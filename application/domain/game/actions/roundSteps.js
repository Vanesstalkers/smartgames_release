(function () {
  const { rounds, round: roundNumber } = this;
  const round = rounds[roundNumber];
  const players = this.players();
  const result = { newRoundLogEvents: [], newRoundNumber: roundNumber };

  switch (this.roundStep) {
    case 'ROUND_START': {
      result.newRoundNumber++;
      result.newRoundLogEvents.push(`<a>Начало раунда №${result.newRoundNumber}.</a>`);

      this.set({ round: result.newRoundNumber }); // без этого не отработает prepareRoundObject -> calcClientMoney
      const round = this.prepareRoundObject();

      const player = this.selectNextActivePlayer();

      player.activate({
        notifyUser: 'Твой ход',
        setData: { eventData: { playDisabled: true, controlBtn: { label: 'Завершить раунд' } } },
      });

      result.statusLabel = `Раунд ${result.newRoundNumber}`;
      result.roundStep = 'ROUND_END';

      for (const player of this.players({ ai: true })) {
        if (!player.active) continue;

        const cards = [];
        switch (this.difficulty) {
          case 'weak':
            break;
          case 'strong':
            break;
        }
        player.aiActions.push(...cards.map((c) => ({ action: 'playCard', data: { cardId: c.id() } })));
      }

      const notAIPlayers = this.getActivePlayers().filter((p) => !p.ai);
      if (notAIPlayers.length === 0) result.forcedEndRound = true;

      return result;
    }

    case 'ROUND_END': {
      result.roundStep = 'ROUND_START';
      return { ...result, forcedEndRound: true };
    }
  }
});
