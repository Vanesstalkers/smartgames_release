(class Dice extends lib.game.GameObject {
  constructor(data, { parent }) {
    super(data, { col: 'dice', parent });
    this.broadcastableFields(['_id', 'code', 'sideList', 'deleted', 'visible', 'locked', 'placedAtRound', 'eventData']);

    const { deleted, visible, locked, placedAtRound } = data;
    this.set({ deleted, visible, locked, placedAtRound });

    const DiceSide = this.game().defaultClasses()['DiceSide'];
    if (data.sideList) {
      const store = this.game().getStore();
      this.set({
        sideList: [
          new DiceSide(store.diceside[data.sideList[0]._id], { parent: this }),
          new DiceSide(store.diceside[data.sideList[1]._id], { parent: this }),
        ],
      });
    } else {
      this.set({
        sideList: [
          new DiceSide({ _code: 1, value: data[0] }, { parent: this }),
          new DiceSide({ _code: 2, value: data[1] }, { parent: this }),
        ],
      });
      if (Math.random() > 0.5) this.sideList.reverse(); // code останется в первичном виде
    }
  }
  customObjectCode({ codeTemplate, replacementFragment }, data) {
    return codeTemplate.replace(replacementFragment, '' + data[0] + data[1]);
  }
  markNew(config) {
    super.markNew(config);
    if (!this.sideList) return; // при создании объекта markNew из GameObject отрабатывает раньше добавления sideList
    this.sideList[0].markNew(config);
    this.sideList[1].markNew(config);
  }
  markDelete(config) {
    super.markDelete(config);
    this.sideList[0].markDelete(config);
    this.sideList[1].markDelete(config);
  }
  updateFakeId(config) {
    super.updateFakeId(config);
    this.sideList[0].updateFakeId(config);
    this.sideList[1].updateFakeId(config);
  }
  prepareBroadcastData({ data, player, viewerMode }) {
    let visibleId = this._id;
    let preparedData = {};
    const bFields = this.broadcastableFields();
    let fake = false;
    const parent = this.parent();
    if (parent.matches({ className: 'Deck' })) {
      if (!parent.access[player?._id] && !this.visible && !viewerMode) {
        fake = true;
        visibleId = this.fakeId[parent.id()];
        if (data.eventData !== undefined) preparedData.eventData = data.eventData;
      }
    }
    if (!fake) {
      for (const [key, value] of Object.entries(data)) {
        if (bFields.includes(key)) {
          if (key === 'sideList') preparedData[key] = value.map(({ _id }) => ({ _id }));
          else preparedData[key] = value;
        }
      }
    }
    return { visibleId, preparedData };
  }
  getRotation() {
    return '' + this.sideList[0].value + this.sideList[1].value;
  }
  rotate() {
    this.set({ sideList: [...this.sideList.reverse()] });
    this.parent().updateValues();
  }

  getTitle() {
    return this.sideList.map((side) => side.value).join('-');
  }
  moveToTarget(target, { markDelete = false } = {}) {
    const currentParent = this.parent();
    currentParent.removeItem(this); // сначала удаляем, чтобы не помешать размещению на соседней зоне
    const moveResult = target.addItem(this);

    if (moveResult) {
      this.set({ visible: null });
      this.updateParent(target);

      if (markDelete) this.markDelete();
    } else {
      currentParent.addItem(this);
    }
    if (currentParent.matches({ className: 'Zone' })) currentParent.updateValues();

    return moveResult;
  }
  moveToDeck() {
    this.set({ deleted: null }); // мог быть
    this.moveToTarget(this.game().find('Deck[domino]'), {
      markDelete: true, // сбрасываем флаги удаления и т.п.
    });
  }
  findAvailableZones() {
    const game = this.game();
    const result = [];

    // включить, если findAvailableZones будет вызываться откуда то кроме showZonesAvailability
    // game.disableChanges();
    {
      // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
      this.parent().removeItem(this);

      const zoneList = [];
      const deletedDices = game.getDeletedDices();
      if (deletedDices.length) {
        const deletedDicesZones = deletedDices.reduce((result, dice) => {
          const zone = dice.parent();
          result.push(zone);
          if (zone.findParent({ className: 'Bridge' })) result.push(...zone.getNearZones());
          return result;
        }, []);

        zoneList.push(...deletedDicesZones);
      } else {
        zoneList.push(
          ...game.decks.table.getAllItems().reduce((arr, plane) => {
            return arr.concat(plane.select('Zone'));
          }, [])
        );
        zoneList.push(
          ...game.getObjects({ className: 'Bridge', directParent: game }).reduce((arr, bridge) => {
            return arr.concat(bridge.select('Zone'));
          }, [])
        );
      }
      for (const zone of zoneList) {
        const { status } = zone.checkIsAvailable(this);
        result.push({ zone, status });
      }

      // восстанавливаем состояние для ранее удаленного dice (ссылка на parent все еще на месте, т.к. она меняется только через updateParent/setParent)
      this.parent().addItem(this);
    }
    // game.enableChanges();
    return result;
  }
  getNearestDices() {
    return this.parent()
      .getNearZones()
      .map((zone) => {
        return zone.getItem() || zone.getDeletedItem();
      })
      .filter((item) => item);
  }
});
