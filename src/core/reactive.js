export function createEmitter() {
  const listeners = [];

  return {
    subscribe(fn) {
      listeners.push(fn);
      return () => {
        const i = listeners.indexOf(fn);
        if (i !== -1) listeners.splice(i, 1);
      };
    },
    emit(...args) {
      listeners.forEach(fn => fn(...args));
    }
  };
}
