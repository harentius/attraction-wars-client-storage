class KeysPressState {
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.space = false;
  }

  isEqual(keysPressState) {
    for (const [key, value] of Object.entries(this)) {
      if (value !== keysPressState[key]) {
        return false;
      }
    }

    return true;
  }
}

export default KeysPressState;
