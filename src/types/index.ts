// =============================================================================
// Vector Types
// =============================================================================

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

// =============================================================================
// Logging Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory =
  | 'system'
  | 'input'
  | 'physics'
  | 'animation'
  | 'camera'
  | 'ui'
  | 'telemetry'
  | 'render';

export interface LoggingConfig {
  ENABLED: boolean;
  MAX_ENTRIES: number;
  MIN_LEVEL: LogLevel;
  CATEGORIES: Record<LogCategory, boolean>;
}

// =============================================================================
// Render Types
// =============================================================================

export type RenderBackend = 'webgpu' | 'webgl';

export interface RenderConfig {
  PREFERRED_BACKEND: RenderBackend;
  ALLOW_WEBGL_FALLBACK: boolean;
  ANTIALIAS: boolean;
  PIXEL_RATIO_MAX: number;
  SHADOWS_ENABLED: boolean;
  SHOW_PERF_STATS: boolean;
  RAYTRACE_ENABLED: boolean;
  RAYTRACE_SCALE: number;
  RAYTRACE_MAX_DISTANCE: number;
  RAYTRACE_UPDATE_HZ: number;
}

// =============================================================================
// Camera Types
// =============================================================================

export interface CameraConfig {
  FOV: number;
  NEAR: number;
  FAR: number;
  OFFSET_X: number;
  OFFSET_Y: number;
  OFFSET_Z: number;
  LOOK_AT_Y: number;
  POSITION_LERP: number;
  ROTATION_LERP: number;
  ZOOM_LERP: number;
  ROTATE_SPEED: number;
  ZOOM_SPEED: number;
  PAN_SPEED: number;
  INVERT_X: boolean;
  INVERT_Y: boolean;
  INVERT_ZOOM: boolean;
  MIN_DISTANCE: number;
  MAX_DISTANCE: number;
  MIN_POLAR_ANGLE: number;
  MAX_POLAR_ANGLE: number;
}

// =============================================================================
// Terrain Types
// =============================================================================

export interface TerrainConfig {
  SIZE: number;
  SEGMENTS: number;
  HEIGHT_SCALE: number;
  NOISE_SCALE_1: number;
  NOISE_SCALE_2: number;
  NOISE_SCALE_3: number;
  COLOR: number;
  ROUGHNESS: number;
  METALNESS: number;
  GRID_DIVISIONS: number;
  GRID_COLOR_CENTER: number;
  GRID_COLOR_LINES: number;
}

// =============================================================================
// Character Types
// =============================================================================

export interface SkeletonConfig {
  TORSO_LENGTH: number;
  UPPER_ARM_LENGTH: number;
  LOWER_ARM_LENGTH: number;
  HEAD_RADIUS: number;
  JOINT_RADIUS: number;
  LIMB_RADIUS: number;
}

export interface CharacterConfig {
  // Dimensions
  HEIGHT: number;
  HIP_HEIGHT: number;
  HIP_WIDTH: number;
  // Movement speeds
  WALK_SPEED: number;
  RUN_SPEED: number;
  // Acceleration
  GROUND_ACCEL: number;
  GROUND_DECEL: number;
  AIR_ACCEL: number;
  AIR_DECEL: number;
  // Turning
  TURN_SPEED: number;
  // Jumping & Gravity
  JUMP_VELOCITY: number;
  GRAVITY: number;
  // Ground detection
  SKIN_WIDTH: number;
  STEP_OFFSET: number;
  SLOPE_LIMIT: number;
  SNAP_DISTANCE: number;
  // Collider
  CAPSULE_RADIUS: number;
  CAPSULE_HEIGHT: number;
  // Landing
  LANDING_DURATION: number;
  // Bounds
  WORLD_BOUNDS: number;
  // Center of Mass
  COM_OFFSET_X: number;
  COM_OFFSET_Y: number;
  COM_OFFSET_Z: number;
  COM_BALANCE_INFLUENCE: number;
  COM_LEAN_COMPENSATION: number;
  // Skeleton proportions
  SKELETON: SkeletonConfig;
}

// =============================================================================
// Animation Types
// =============================================================================

export interface AnimationConfig {
  // Walk cycle
  WALK_CYCLE_SPEED: number;
  RUN_CYCLE_SPEED: number;
  // Stride
  WALK_STRIDE_LENGTH: number;
  RUN_STRIDE_LENGTH: number;
  WALK_STRIDE_HEIGHT: number;
  RUN_STRIDE_HEIGHT: number;
  // IK
  IK_BLEND_SPEED: number;
  FOOT_PLANT_TOLERANCE: number;
  PELVIS_DROP_MAX: number;
  // Leg dimensions
  UPPER_LEG_LENGTH: number;
  LOWER_LEG_LENGTH: number;
  // Arm swing
  ARM_SWING_WALK: number;
  ARM_SWING_RUN: number;
  ELBOW_BEND_BASE: number;
  // Torso
  TORSO_LEAN_WALK: number;
  TORSO_LEAN_RUN: number;
  TORSO_LEAN_JUMP: number;
  TORSO_LEAN_FALL: number;
  TORSO_TWIST_AMOUNT: number;
  // Head
  HEAD_BOB_AMOUNT: number;
  // Hip
  HIP_SWAY_AMOUNT: number;
  // Breathing
  BREATHE_SPEED: number;
  BREATHE_AMPLITUDE: number;
  // Landing
  LANDING_IMPACT: number;
}

// =============================================================================
// Debug Types
// =============================================================================

export interface DebugConfig {
  // Visibility toggles
  SHOW_FOOT_TARGETS: boolean;
  SHOW_COM_MARKER: boolean;
  SHOW_PLUMB_LINE: boolean;
  SHOW_VELOCITY_ARROW: boolean;
  SHOW_SUPPORT_POLYGON: boolean;
  SHOW_COM_TRAIL: boolean;
  SHOW_SKELETON_JOINTS: boolean;
  SHOW_GROUND_CONTACT: boolean;
  // Marker sizes
  FOOT_MARKER_SIZE: number;
  COM_MARKER_SIZE: number;
  JOINT_MARKER_SIZE: number;
  // Colors
  COM_COLOR: number;
  PLUMB_COLOR: number;
  VELOCITY_COLOR: number;
  STANCE_COLOR: number;
  SWING_COLOR: number;
}

// =============================================================================
// Game Config (combined)
// =============================================================================

export interface GameConfig {
  camera: CameraConfig;
  terrain: TerrainConfig;
  character: CharacterConfig;
  animation: AnimationConfig;
  debug: DebugConfig;
  logging: LoggingConfig;
  render: RenderConfig;
}

// =============================================================================
// Center of Mass Types
// =============================================================================

export interface SegmentMasses {
  head: number;
  torso: number;
  leftUpperArm: number;
  rightUpperArm: number;
  leftLowerArm: number;
  rightLowerArm: number;
  leftHand: number;
  rightHand: number;
  leftUpperLeg: number;
  rightUpperLeg: number;
  leftLowerLeg: number;
  rightLowerLeg: number;
  leftFoot: number;
  rightFoot: number;
}

export interface TrailConfig {
  MAX_POINTS: number;
  FADE_START: number;
  LINE_WIDTH: number;
  COLOR_START: number;
  COLOR_END: number;
}

export interface StabilityConfig {
  STABLE_MARGIN: number;
  WARNING_MARGIN: number;
  UNSTABLE_MARGIN: number;
}

export interface VelocityArrowConfig {
  SCALE: number;
  MIN_LENGTH: number;
  MAX_LENGTH: number;
  HEAD_LENGTH: number;
  HEAD_WIDTH: number;
}

export interface SupportPolygonConfig {
  FOOT_LENGTH: number;
  FOOT_WIDTH: number;
  LINE_WIDTH: number;
  COLOR_STABLE: number;
  COLOR_UNSTABLE: number;
}

export interface CoMConfig {
  SEGMENT_MASSES: SegmentMasses;
  TRAIL: TrailConfig;
  STABILITY: StabilityConfig;
  VELOCITY_ARROW: VelocityArrowConfig;
  SUPPORT_POLYGON: SupportPolygonConfig;
}

/**
 * State of the center of mass system
 */
export interface CoMState {
  position: Vector3Like;
  velocity: Vector3Like;
  groundProjection: Vector3Like;
  isStable: boolean;
  stabilityMargin: number;
  stabilityLevel: 'stable' | 'warning' | 'unstable';
}

/**
 * Bone world positions map
 */
export type BonePositions = Map<string, Vector3Like>;
