(class ReleaseGameSession extends lib.game.Session() {
  getUserClass() {
    return domain.game.User;
  }
});
