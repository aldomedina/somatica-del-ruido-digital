import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ScenePage from "./pages/ScenePage";
import "./styles/reset.css";
import "./styles/globals.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scene" element={<ScenePage />} />
      </Routes>
    </Router>
  );
}

export default App;
