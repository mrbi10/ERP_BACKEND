const otpStore = new Map();

module.exports = {
  set(email, otp) {
    otpStore.set(email, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 
    });
  },

  get(email) {
    return otpStore.get(email);
  },

  remove(email) {
    otpStore.delete(email);
  }
};
