import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MediaPipeTestPage from "./pages/MediaPipeTestPage";
import SuperPixelWallPage from "./pages/SuperPixelWallPage";

import "./styles/reset.css";
import "./styles/globals.css";
import Laitec from "./pages/Laitec";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/laitec" element={<Laitec />} />
        <Route path="/wall" element={<SuperPixelWallPage />} />
        <Route path="/media-pipe-test" element={<MediaPipeTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
