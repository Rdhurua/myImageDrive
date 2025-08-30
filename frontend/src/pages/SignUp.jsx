import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/signup`, form);
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  return (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
  <form
    onSubmit={handleSubmit}
    className="bg-white p-8 rounded-2xl shadow-lg w-96 transform transition duration-300 hover:scale-[1.02]"
  >
    <h2 className="text-3xl mb-6 font-extrabold text-center text-gray-800">
      Create an Account
    </h2>

    <input
      name="username"
      placeholder="Username"
      onChange={handleChange}
      className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    />

    <input
      name="email"
      type="email"
      placeholder="Email"
      onChange={handleChange}
      className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    />

    <input
      name="password"
      type="password"
      placeholder="Password"
      onChange={handleChange}
      className="w-full p-3 border border-gray-300 rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    />

    <button
      type="submit"
      className="bg-blue-500 text-white p-3 rounded-lg w-full hover:bg-blue-600 transition-colors font-semibold"
    >
      Sign Up
    </button>

    <p className="mt-4 text-center text-gray-600 text-sm">
      Already have an account?{" "}
      <a href="/login" className="text-blue-500 hover:underline">
        Login here
      </a>
    </p>
  </form>
</div>

  );
};

export default SignUp;
