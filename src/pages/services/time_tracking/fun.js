import moment from "moment";

export function getObject(list, val) {
  return list.find((r) => r.id === val);
}
export const TT_TYPE_FLAG = 'tinyint(1)';
export const STRING_NO_SELECT = 'Не выбрано';
export const OPTION_ALL = {
  id: -1,
  name: 'Все',
};
export const OPTION_NONE = {
  id: -1,
  name: '-',
};
export function getNameShort(_name) {
  try {
    const n = _name.split(' ').filter((e) => e !== '');
    if (n.length !== 3) {
      return _name;
    }
    return `${n[0]} ${n[1] ? `${n[1][0]}.` : ''}${n[1] ? `${n[2][0]}.` : ''}`;
  } catch {
    return _name;
  }
}
export function isDateInRange(dateToCheck, startDate, endDate) {
  const checkDate = moment(dateToCheck);
  const start = moment(startDate);
  const end = moment(endDate);
  return checkDate.isBetween(start, end, null, '[]');
}

// возвращает новый ID исходя из объектов списка
export function getNewId(existingItems = []) {
  // Находим максимальный ID среди всех элементов (включая вложенные)
  let maxId = 0;

  const findMaxId = (items) => {
    items.forEach((item) => {
      if (item.id > maxId) {
        maxId = item.id;
      }
      if (item.children && item.children.length > 0) {
        findMaxId(item.children);
      }
    });
  };

  findMaxId(existingItems);
  return maxId + 1;
}
