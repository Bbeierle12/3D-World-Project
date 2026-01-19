import type * as THREE from 'three';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  filename?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Captures a screenshot from the Three.js renderer
 */
export function captureScreenshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: ScreenshotOptions = {}
): void {
  const {
    width = renderer.domElement.width,
    height = renderer.domElement.height,
    filename = `screenshot-${Date.now()}`,
    format = 'png',
    quality = 0.92
  } = options;

  // Store original size
  const originalWidth = renderer.domElement.width;
  const originalHeight = renderer.domElement.height;

  // Temporarily resize if needed
  const needsResize = width !== originalWidth || height !== originalHeight;
  if (needsResize) {
    renderer.setSize(width, height, false);
    if ((camera as THREE.PerspectiveCamera).aspect !== undefined) {
      (camera as THREE.PerspectiveCamera).aspect = width / height;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }

  // Render the scene
  renderer.render(scene, camera);

  // Get canvas data
  const canvas = renderer.domElement;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const dataURL = canvas.toDataURL(mimeType, quality);

  // Convert to blob and download
  const parts = dataURL.split(',');
  const base64Part = parts[1];
  const metaPart = parts[0];
  if (!base64Part || !metaPart) {
    console.error('Failed to create screenshot data URL');
    return;
  }

  const byteString = atob(base64Part);
  const mimeMatch = metaPart.split(':')[1]?.split(';')[0];
  const mimeString = mimeMatch || mimeType;
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer], { type: mimeString });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);

  // Restore original size if changed
  if (needsResize) {
    renderer.setSize(originalWidth, originalHeight, false);
    if ((camera as THREE.PerspectiveCamera).aspect !== undefined) {
      (camera as THREE.PerspectiveCamera).aspect = originalWidth / originalHeight;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }

  console.log(`Screenshot saved: ${filename}.${format}`);
}

/**
 * Captures a screenshot asynchronously and returns it as a Blob
 */
export async function captureScreenshotAsBlob(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: ScreenshotOptions = {}
): Promise<Blob> {
  const {
    width = renderer.domElement.width,
    height = renderer.domElement.height,
    format = 'png',
    quality = 0.92
  } = options;

  // Store original size
  const originalWidth = renderer.domElement.width;
  const originalHeight = renderer.domElement.height;

  // Temporarily resize if needed
  const needsResize = width !== originalWidth || height !== originalHeight;
  if (needsResize) {
    renderer.setSize(width, height, false);
    if ((camera as THREE.PerspectiveCamera).aspect !== undefined) {
      (camera as THREE.PerspectiveCamera).aspect = width / height;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }

  // Render the scene
  renderer.render(scene, camera);

  // Get canvas as blob
  const canvas = renderer.domElement;
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Restore original size
        if (needsResize) {
          renderer.setSize(originalWidth, originalHeight, false);
          if ((camera as THREE.PerspectiveCamera).aspect !== undefined) {
            (camera as THREE.PerspectiveCamera).aspect = originalWidth / originalHeight;
            (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
          }
        }

        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create screenshot blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

export default { captureScreenshot, captureScreenshotAsBlob };
