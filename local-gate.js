/* Local preview only. No student roster, account collection, or remote API. */
window.GATE_CONFIG = { apiUrl: '', allowSignup: false };
window.GATE = {
  getSession: () => null,
  logout: () => { location.href = 'index.html'; },
  requireLogin: () => true
};
