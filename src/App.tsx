import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MediaPipeTestPage from "./pages/MediaPipeTestPage";
import SuperPixelPage from "./pages/SuperPixelPage";

import "./styles/reset.css";
import "./styles/globals.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/superpixel" element={<SuperPixelPage />} />
        <Route path="/media-pipe-test" element={<MediaPipeTestPage />} />
      </Routes>
    </Router>
  );
}

export default App;
