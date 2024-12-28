(function ({ zone }, initPlayer) {
    const parent = zone.getParent();

    if (parent.release) return; // РЕЛИЗ был активирован ранее
    if (parent.select('Zone').find((zone) => !zone.getNotDeletedItem())) return; // есть удаленные домино

    parent.set({ release: true });
    zone.game().toggleEventHandlers('RELEASE', {}, initPlayer);
});
