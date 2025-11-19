// dropdownManager.js
let currentOpenDropdown = null;

export const dropdownManager = {
  setCurrent(dropdown) {
    if (currentOpenDropdown && currentOpenDropdown !== dropdown) {
      currentOpenDropdown.close();
    }
    currentOpenDropdown = dropdown;
  },

  removeCurrent(dropdown) {
    if (currentOpenDropdown === dropdown) {
      currentOpenDropdown = null;
    }
  },

  closeAll() {
    if (currentOpenDropdown) {
      currentOpenDropdown.close();
      currentOpenDropdown = null;
    }
  }
};
