({
  decorate: () => ({
    ...lib.chat['@class'].decorate(),
    async updateChat({ text, user, event }, { preventSaveChanges = false } = {}) {
      const time = Date.now();
      const chatEvent = { text, event, user, time, parent: this.storeId() };
      const { _id } = await db.mongo.insertOne('chat', chatEvent);
      chatEvent._id = _id.toString();
      this.set({ chat: { [_id]: chatEvent } });
      if (!preventSaveChanges) await this.saveChanges();
      return { chatEventId: chatEvent._id };
    },
  })
})