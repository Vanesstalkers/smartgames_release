(function ({ }, player) {
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
                player.publishInfo({ text: 'В команде нет игроков, кому можно передать руководство.' });
                return { resetEvent: true };
            }
            player.set({ eventData });
        },
        handlers: {
            RESET: function () {
                const { game, player } = this.eventContext();
                player.set({ eventData: { player: null } });
                this.destroy();
            },
            TRIGGER: function ({ target: targetPlayer }) {
                const { game, player } = this.eventContext();

                game.logs({
                    msg: `Игрок {{player}} стал новым тимлидом команды.`,
                    userId: targetPlayer.userId,
                });

                player.set({ teamlead: null });
                targetPlayer.set({ teamlead: true });

                this.emit('RESET');
            },
            END_ROUND: function () {
                const { game, player } = this.eventContext();

                const targetPlayer = game.players().find(p => !p.teamlead);

                if (!targetPlayer) return this.emit('RESET');
                this.emit('TRIGGER', { target: targetPlayer });
            },
        },
    }, { player });
}); 