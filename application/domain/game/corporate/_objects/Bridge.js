(class Bridge extends domain.game._objects.Bridge {
  constructor(data) {Bridge
    super(...arguments);
    this.set({ mergedGameId: data.mergedGameId });
  }
});
