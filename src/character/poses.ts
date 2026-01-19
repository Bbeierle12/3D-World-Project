export interface PosePreset {
  name: string;
  description: string;
  jointAngles: Record<string, { x: number; y: number; z: number }>;
}

export const BUILT_IN_POSE_PRESETS: PosePreset[] = [
  {
    name: 'T-Pose',
    description: 'Standard T-pose with arms extended',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0, y: 0, z: Math.PI / 2 },
      rightUpperArm: { x: 0, y: 0, z: -Math.PI / 2 },
      leftLowerArm: { x: 0, y: 0, z: 0 },
      rightLowerArm: { x: 0, y: 0, z: 0 },
      leftUpperLeg: { x: 0, y: 0, z: 0 },
      rightUpperLeg: { x: 0, y: 0, z: 0 },
      leftLowerLeg: { x: 0, y: 0, z: 0 },
      rightLowerLeg: { x: 0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Single-Leg (Left)',
    description: 'Balanced on left leg',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.5 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0, y: 0, z: 0 },
      rightUpperLeg: { x: 0.8, y: 0, z: 0 },
      leftLowerLeg: { x: 0, y: 0, z: 0 },
      rightLowerLeg: { x: 0.5, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0.05 }
    }
  },
  {
    name: 'Single-Leg (Right)',
    description: 'Balanced on right leg',
    jointAngles: {
      spine: { x: 0, y: 0, z: 0 },
      neck: { x: 0, y: 0, z: 0 },
      leftUpperArm: { x: 0.2, y: 0, z: 0.5 },
      rightUpperArm: { x: 0.2, y: 0, z: -0.5 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0.8, y: 0, z: 0 },
      rightUpperLeg: { x: 0, y: 0, z: 0 },
      leftLowerLeg: { x: 0.5, y: 0, z: 0 },
      rightLowerLeg: { x: 0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: -0.05 }
    }
  },
  {
    name: 'Mid-Stride',
    description: 'Walking mid-stride pose',
    jointAngles: {
      spine: { x: 0.1, y: 0.1, z: 0 },
      neck: { x: -0.05, y: 0, z: 0 },
      leftUpperArm: { x: -0.4, y: 0, z: 0 },
      rightUpperArm: { x: 0.4, y: 0, z: 0 },
      leftLowerArm: { x: -0.5, y: 0, z: 0 },
      rightLowerArm: { x: -0.5, y: 0, z: 0 },
      leftUpperLeg: { x: -0.4, y: 0, z: 0 },
      rightUpperLeg: { x: 0.5, y: 0, z: 0 },
      leftLowerLeg: { x: 0.3, y: 0, z: 0 },
      rightLowerLeg: { x: 0.7, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Crouch',
    description: 'Crouching pose',
    jointAngles: {
      spine: { x: 0.3, y: 0, z: 0 },
      neck: { x: -0.2, y: 0, z: 0 },
      leftUpperArm: { x: 0.4, y: 0, z: 0.3 },
      rightUpperArm: { x: 0.4, y: 0, z: -0.3 },
      leftLowerArm: { x: -0.8, y: 0, z: 0 },
      rightLowerArm: { x: -0.8, y: 0, z: 0 },
      leftUpperLeg: { x: 1.2, y: 0, z: 0 },
      rightUpperLeg: { x: 1.2, y: 0, z: 0 },
      leftLowerLeg: { x: 2.0, y: 0, z: 0 },
      rightLowerLeg: { x: 2.0, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  },
  {
    name: 'Jump',
    description: 'Mid-jump pose',
    jointAngles: {
      spine: { x: -0.1, y: 0, z: 0 },
      neck: { x: 0.1, y: 0, z: 0 },
      leftUpperArm: { x: -0.5, y: 0, z: 0.8 },
      rightUpperArm: { x: -0.5, y: 0, z: -0.8 },
      leftLowerArm: { x: -0.3, y: 0, z: 0 },
      rightLowerArm: { x: -0.3, y: 0, z: 0 },
      leftUpperLeg: { x: 0.4, y: 0, z: 0 },
      rightUpperLeg: { x: 0.4, y: 0, z: 0 },
      leftLowerLeg: { x: 0.6, y: 0, z: 0 },
      rightLowerLeg: { x: 0.6, y: 0, z: 0 },
      root: { x: 0, y: 0, z: 0 }
    }
  }
];
