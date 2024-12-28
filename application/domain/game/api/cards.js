({
  access: 'public',
  method: async (context, { template } = {}) => {
    if (!template) template = domain.game.configs.cardTemplates.random();

    const cards = domain.game.configs
      .cards()
      .map(({ name }) => `${template}/${name}.jpg`)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });

    return { status: 'ok', cards };
  },
});
