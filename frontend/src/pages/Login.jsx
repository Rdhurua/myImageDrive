import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, form);
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
   <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100">
  <form 
    onSubmit={handleSubmit} 
    className="bg-white p-8 rounded-2xl shadow-lg w-96 transform transition-all hover:scale-[1.01]"
  >
    <h2 className="text-3xl mb-6 font-extrabold text-center text-gray-800">
      Welcome Back
    </h2>
    <div className="space-y-4">
      <input 
        name="email" 
        type="email" 
        placeholder="Email" 
        onChange={handleChange} 
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
      />
      <input 
        name="password" 
        type="password" 
        placeholder="Password" 
        onChange={handleChange} 
        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition"
      />
      <button 
        type="submit" 
        className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300"
      >
        Login
      </button>
    </div>
    <p className="text-center text-sm text-gray-500 mt-4">
      Don’t have an account? 
      <a href="/signup" className="text-green-600 font-semibold hover:underline ml-1">
        Sign up
      </a>
    </p>
  </form>
</div>

  );
};

export default Login;
