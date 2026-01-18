/**
 * Input manager handling keyboard (and future gamepad) input
 * Maps raw keys to semantic actions
 */
export class InputManager {
  constructor() {
    // Raw key states
    this.keys = new Set();
    this.justPressedKeys = new Set();

    // Action mappings
    this.actionMappings = {
      forward: ['KeyW', 'ArrowUp'],
      backward: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      jump: ['Space'],
      run: ['ShiftLeft', 'ShiftRight'],
      debug: ['KeyV']
    };

    // Bind handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Track if attached
    this.attached = false;
  }

  /**
   * Attach event listeners
   */
  attach() {
    if (this.attached) return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.attached = true;
  }

  /**
   * Detach event listeners
   */
  detach() {
    if (!this.attached) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.attached = false;
    this.keys.clear();
    this.justPressedKeys.clear();
  }

  handleKeyDown(event) {
    if (!this.keys.has(event.code)) {
      this.justPressedKeys.add(event.code);
    }
    this.keys.add(event.code);

    // Prevent default for game keys
    if (event.code === 'Space') {
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  /**
   * Check if an action is currently pressed
   * @param {string} action
   * @returns {boolean}
   */
  isPressed(action) {
    const mappings = this.actionMappings[action];
    if (!mappings) return false;
    return mappings.some(key => this.keys.has(key));
  }

  /**
   * Check if an action is currently held down
   * @param {string} action
   * @returns {boolean}
   */
  isHeld(action) {
    return this.isPressed(action);
  }

  /**
   * Get movement direction as normalized vector
   * @returns {{x: number, y: number}}
   */
  getMovementDirection() {
    let x = 0;
    let y = 0;

    if (this.isPressed('forward')) y += 1;
    if (this.isPressed('backward')) y -= 1;
    if (this.isPressed('left')) x -= 1;
    if (this.isPressed('right')) x += 1;

    // Normalize diagonal movement
    const len = Math.sqrt(x * x + y * y);
    if (len > 0) {
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  /**
   * Check if action was just pressed this frame
   * (Would need frame tracking for proper implementation)
   * @param {string} action
   * @returns {boolean}
   */
  justPressed(action) {
    const mappings = this.actionMappings[action];
    if (!mappings) return false;

    let pressed = false;
    for (const key of mappings) {
      if (this.justPressedKeys.has(key)) {
        this.justPressedKeys.delete(key);
        pressed = true;
      }
    }

    return pressed;
  }
}

export default InputManager;
