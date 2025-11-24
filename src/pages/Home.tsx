import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Cartografias de ...</h1>
      <Link to="/scene">
        Explore 3D Scene
      </Link>
    </div>
  );
}

export default Home;
