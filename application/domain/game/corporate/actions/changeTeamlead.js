(function ({ }, player) {
    try {
        this.initEvent({
            name: 'changeTeamlead',
            init() {
                const { game, player } = this.eventContext();

                const eventData = { player: {} };
                for (const player of game.players()) {
                    if (player.teamlead) continue;
                    eventData.player[player.id()] = { selectable: true };
                }
                if (Object.keys(eventData.player).length === 0) {
                    return { resetEvent: true };
                }
                player.set({ eventData });
            },
            handlers: {
                RESET: function () {
                    const { game, player } = this.eventContext();
                    const user = lib.store('user').get(player.userId);

                    player.set({ eventData: { player: null } });

                    user.set({ currentTutorial: null, helper: null });
                    user.saveChanges();

                    this.destroy();
                },
                TRIGGER: function ({ target: targetPlayer }) {
                    const { game, player } = this.eventContext();

                    //  нажали кнопку "Отмена"
                    if (!targetPlayer) return this.emit('RESET');
                    if (!targetPlayer.ready) {
                        player.notifyUser('Игрок не может быть тимлидом, т.к. он вышел из игры.');
                        return this.emit('RESET');
                    }

                    game.logs({
                        msg: `Игрок {{player}} стал новым тимлидом команды.`,
                        userId: targetPlayer.userId,
                    });

                    targetPlayer.set({ teamlead: true });
                    player.set({ teamlead: null });

                    this.emit('RESET');
                },
                END_ROUND: function () {
                    this.emit('RESET');
                },
            },
        }, { player });
    } catch (err) {
        // событие активируется через меню тимлида, которое уже открыто (call action changeTeamlead делается в before.action tutorial-а ) - нужно отменить активный диалог

        const user = lib.store('user').get(player.userId);
        user.set({ currentTutorial: null, helper: null });
        user.saveChanges();

        throw err;
    }
}); 