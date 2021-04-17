const event = {
  order: 0,
  title: '',
  subtitle: '',
  presenter: '',
  timeStart: 0,
  timeEnd: 0,
  clockStarted: null,
  isPublic: false,
  type: 'event',
};

const delay = {
  order: 0,
  duration: 0,
  type: 'delay',
};

const block = {
  order: 0,
  type: 'block',
};

module.exports = { event, delay, block };