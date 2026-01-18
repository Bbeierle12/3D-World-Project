// Debug visualization parameters
export const DEBUG = {
  // Visibility toggles
  SHOW_FOOT_TARGETS: true,
  SHOW_COM_MARKER: false,
  SHOW_PLUMB_LINE: false,
  SHOW_VELOCITY_ARROW: false,
  SHOW_SKELETON_JOINTS: false,
  SHOW_GROUND_CONTACT: false,

  // Marker sizes
  FOOT_MARKER_SIZE: 0.15,
  COM_MARKER_SIZE: 0.2,
  JOINT_MARKER_SIZE: 0.1,

  // Colors
  COM_COLOR: 0xff0000,
  PLUMB_COLOR: 0xffff00,
  VELOCITY_COLOR: 0x00ff00,
  STANCE_COLOR: 0x00ff00,
  SWING_COLOR: 0xff00ff,

  // Dev tools
  DEV_TOOLS_ENABLED: true,
  DEV_TOOLS_WIDTH: 300,
  DEV_TOOLS_COLLAPSED: false
};

export default DEBUG;
