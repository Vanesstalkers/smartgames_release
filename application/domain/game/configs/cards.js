() => ({
  path: (card) => `${card.group}/${card.name}.jpg`,
  list: (domain.custom_cards = [
    // 'transfer',
  ]).length
    ? (() =>
      Array(10)
        .fill(null)
        .reduce((__) => __.concat(domain.custom_cards.map((name) => ({ name, title: name.toUpperCase(), playOneTime: false }))), []))()
    : [
      { name: 'audit', title: 'ИТ-аудит' },
      { name: 'claim', title: 'Жалоба' },
      { name: 'coffee', title: 'Кофемашина' },
      { name: 'crutch', title: 'Костыль' },
      { name: 'crutch', title: 'Костыль' },
      { name: 'crutch', title: 'Костыль' },
      { name: 'disease', title: 'Болезнь' },
      { name: 'dream', title: 'Директору приснился сон' },
      { name: 'emergency', title: 'Аврал' },
      { name: 'flowstate', title: 'Состояние потока' },
      { name: 'give_project', title: 'Передаешь свой проект' },
      { name: 'insight', title: 'Внезапное озарение' },
      { name: 'lib', title: 'Нашел новую библиотеку' },
      { name: 'pilot', title: 'Доработки по результатам пилотного проекта', playOneTime: true },
      { name: 'refactoring', title: 'Рефакторинг' },
      { name: 'req_legal', title: 'Требования правительства', playOneTime: true },
      { name: 'req_tax', title: 'Требования налоговой', playOneTime: true },
      { name: 'security', title: 'Новый безопасник' }, 
      { name: 'showoff', title: 'Показать себя начальнику' },
      { name: 'superman', title: 'Поверил в себя' },
      { name: 'take_project', title: 'Взял чужой проект' },
      { name: 'time', title: 'Про**ал сроки' },
      { name: 'time', title: 'Про**ал сроки' },
      { name: 'time', title: 'Про**ал сроки' },
      { name: 'teamlead', title: 'Совет тимлида' },
      { name: 'transfer', title: 'Перевели в новый отдел' },
      { name: 'weekend', title: 'Поработал в выходные' },
      { name: 'water', title: 'Залил ноутбук' },
    ]
});
