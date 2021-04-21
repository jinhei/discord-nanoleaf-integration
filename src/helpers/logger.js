import _ from 'lodash';

const LOGGING_METHODS = ['group', 'log', 'warn', 'error'];

class Logger {
  constructor({ name }) {
    this.name = name;

    const nameTag = this.buildNameTag(name);
    _.forEach(console, (fn, method) => {
      this[method] = LOGGING_METHODS.includes(method)
        ? (...args) => fn.apply(this, [...nameTag, ...args])
        : fn;
    });
  }

  generateHue() {
    let sum = 0;
    for (let i; i < this.name.length; i += 1) {
      sum += this.name.charCodeAt(i);
    }
    return sum % 361;
  }

  buildNameTag(name) {
    const hue = this.generateHue();
    return [
      `%c${name}`,
      [
        'padding: 2px',
        'border-radius: 2px',
        `background: hsl(${hue}, 100%, 50%),`,
        'font-weight: 600',
      ].join('; '),
      '\n',
    ];
  }
}

export default Logger;
