(class ZoneSide extends domain.game._objects.ZoneSide {
  /**
   * (используется в zone.checkIsAvailable)
   */
  updateExpectedValues() {
    // !!!! что-то с поиском в средней зоне
    const expectedValues = lib.utils.keysToNull(this.expectedValues);
    for (const linkCode of Object.values(this.links)) {
      let link = this.game().find(linkCode);
      if (!link) link = this.game().game?.().find(linkCode);
      if (link?.value != null) {
        // "!= null" === "a !== null && a !== undefined"
        expectedValues[link.value] = true;
      }
    }
    this.set({ expectedValues });
  }
});
