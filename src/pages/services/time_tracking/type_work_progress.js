const TYPE_WORK_PROGRESS_ALL = 0;
const TYPE_WORK_PROGRESS_ONLY_FULL = 1;
const TYPE_WORK_PROGRESS_ZERO_OR_FULL = 2;
const type_work_progress = [
  {
    id: TYPE_WORK_PROGRESS_ALL,
    name: 'Любой',
  },
  {
    id: TYPE_WORK_PROGRESS_ONLY_FULL,
    name: 'Только 100%',
  },
  {
    id: TYPE_WORK_PROGRESS_ZERO_OR_FULL,
    name: '0% или 100%',
  },
];
export {
  type_work_progress,
  TYPE_WORK_PROGRESS_ALL,
  TYPE_WORK_PROGRESS_ONLY_FULL,
  TYPE_WORK_PROGRESS_ZERO_OR_FULL,
};
