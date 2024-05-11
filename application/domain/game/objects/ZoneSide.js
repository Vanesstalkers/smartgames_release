(class ZoneSide extends lib.game.GameObject {
  constructor(data, { parent }) {
    super(data, { col: 'zoneside', parent });
    this.broadcastableFields(['_id', 'code', 'value', 'links', 'expectedValues']);

    this.set({
      value: data.value,
      links: data.links || {},
      expectedValues: data.expectedValues || {},
    });
  }

  addLink(link) {
    this.set({ links: { [link._id]: link.code } });
  }
  deleteLink(link) {
    this.set({ links: { [link._id]: null } });
  }

  /**
   * (используется в zone.checkIsAvailable)
   */
  updateExpectedValues() {
    const expectedValues = lib.utils.keysToNull(this.expectedValues);
    for (const linkCode of Object.values(this.links)) {
      const link = this.game().find(linkCode);
      if (link.value != null)
        // "!= null" === "a !== null && a !== undefined"
        expectedValues[link.value] = true;
    }
    this.set({ expectedValues });
  }
});
