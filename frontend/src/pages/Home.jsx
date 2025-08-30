import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to Our App</h1>
        <p className="mb-6 text-gray-600">Please sign up or log in to continue</p>
        <div className="flex flex-col gap-4">
          <Link to="/signup">
            <button className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600 transition">
              Sign Up
            </button>
          </Link>
          <Link to="/login">
            <button className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600 transition">
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
