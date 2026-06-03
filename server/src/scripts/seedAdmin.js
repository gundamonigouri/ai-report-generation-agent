import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User } from '../models/User.js';

async function seed() {
  await mongoose.connect(config.mongodbUri);
  const existing = await User.findOne({ email: config.admin.email });
  if (existing) {
    console.log('Admin user already exists:', config.admin.email);
    process.exit(0);
  }
  await User.create({
    name: 'System Admin',
    email: config.admin.email,
    password: config.admin.password,
    role: 'admin',
  });
  console.log('Admin user created:', config.admin.email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
