import express from "express";

import { logout, refresh, signIn, signUp } from "../controllers/authcontroller.js";

const router = express.Router();

// Signup
router.post("/signup",signUp );

// Login
router.post("/login",signIn );

// Refresh
router.post("/refresh",refresh );

// Logout
router.post("/logout",logout );

export default router;
