(function ({ }, player) {
    try {
        this.initEvent({
            name: 'removePlayer',
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
                        lib.store.broadcaster.publishAction(`gameuser-${player.userId}`, 'broadcastToSessions', {
                            data: { message: 'Игрок не может быть удален, т.к. он вышел из игры.' },
                        });
                        return this.emit('RESET');
                    }

                    const superGame = game.game();
                    const userId = targetPlayer.userId;

                    game.logs({ msg: `Игрок {{player}} удален из команды.`, userId });
                    lib.store.broadcaster.publishAction(`game-${superGame.id()}`, 'playerLeave', { userId });

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