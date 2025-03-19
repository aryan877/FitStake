import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { validateEmail, validatePassword } from '../utils/validators';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!validateEmail(email) || !validatePassword(password)) {
      return res.status(400).json({ error: 'Invalid email or password format' });
    }

    // Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new UserModel({ email, password });
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};