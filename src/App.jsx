import { Canvas3D, ControlsOverlay } from './components'
import './index.css'

function App() {
  return (
    <div className="w-full h-screen relative">
      <Canvas3D />
      <ControlsOverlay />
    </div>
  )
}

export default App
