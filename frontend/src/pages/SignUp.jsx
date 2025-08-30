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
      await axios.post("http://localhost:4000/api/auth/signup", form);
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-2xl mb-4 font-bold text-center">Sign Up</h2>
        <input name="username" placeholder="Username" onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} className="w-full p-2 border rounded mb-2" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-2 border rounded mb-4" />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600">Sign Up</button>
      </form>
    </div>
  );
};

export default SignUp;
