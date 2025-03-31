(class ZoneSide extends domain.game._objects.ZoneSide {
  /**
   * (используется в zone.checkIsAvailable)
   */
  updateExpectedValues() {
    const expectedValues = lib.utils.keysToNull(this.expectedValues);
    for (const linkSideId of Object.keys(this.links)) {
      let link = this.game().get(linkSideId);
      if (!link) link = this.game().game?.().get(linkSideId);
      if (link?.value != null) {
        // "!= null" === "a !== null && a !== undefined"
        expectedValues[link.value] = true;
      }
    }
    this.set({ expectedValues });
  }
});
