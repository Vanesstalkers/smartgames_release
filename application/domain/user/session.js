() =>
  class TO_CHANGE extends lib.game.sessionClass() {
    getUserClass() {
      return domain.user.class();
    }
  };
