({
  access: 'public',
  method: async (context, {} = {}) => {
    const cards = domain.game.configs.cards()
      .map(({ name }) => `${name}.jpg`)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });

    return { status: 'ok', cards };
  },
});
