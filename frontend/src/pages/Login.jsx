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
      const res = await axios.post("http://localhost:4000/api/auth/login", form);
      console.log(res.data.accessToken);
      localStorage.setItem("token", res.data.accessToken);
      localStorage.setItem("user", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-2xl mb-4 font-bold text-center">Login</h2>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-2 border rounded mb-4" />
        <button type="submit" className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600">Login</button>
      </form>
    </div>
  );
};

export default Login;
