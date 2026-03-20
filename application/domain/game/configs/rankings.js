(code) => {
  const list = {
    richestPlayers: {
      title: 'Самые богатые',
      active: true,
      sortFunc: (a, b) => ((a.money || -1) > (b.money || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Написано проектов' },
        { code: 'money', title: 'Заработано денег' },
      ],
    },
    topPlayers: {
      title: 'Трудоголики',
      sortFunc: (a, b) => ((a.games || -1) > (b.games || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Написано проектов' },
        { code: 'win', title: 'Закончено проектов' },
      ],
    },
    bestQuality: {
      title: 'Лучшее качество',
      sortFunc: (a, b) => ((a.crutch || -1) / (a.games || -1) < (b.crutch || -1) / (b.games || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Написано проектов' },
        { code: 'crutch', title: 'Костылей' },
        { code: 'penalty', title: 'Штрафов' },
      ],
    },
    bestT2M: {
      title: 'Лучший time2market',
      sortFunc: (a, b) => ((a.avrTime || -1) < (b.avrTime || -1) ? -1 : 1),
      headers: [
        { code: 'games', title: 'Написано проектов' },
        { code: 'totalTime', title: 'Потрачено времени' },
        { code: 'avrTime', title: 'В среднем' },
      ],
    },
  };
  return code ? list[code] : list;
};
