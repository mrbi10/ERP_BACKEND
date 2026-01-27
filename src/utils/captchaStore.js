const captchaStore = {};

module.exports = {
  set(id, text) {
    captchaStore[id] = text.toLowerCase();
  },

  get(id) {
    return captchaStore[id];
  },

  remove(id) {
    delete captchaStore[id];
  }
};