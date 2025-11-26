import { Link } from "react-router-dom";

function Home() {
  return (
    <div
      style={{
        display: "flex",
        gap: 48,
        padding: 32,
      }}
    >
      <Link to="/superpixel">superpixel</Link>
      <Link to="/media-pipe-test">media-pipe-test</Link>
    </div>
  );
}

export default Home;
