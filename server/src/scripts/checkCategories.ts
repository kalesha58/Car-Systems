import '../config/env';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

async function check() {
  try {
    await connectDatabase();
    const categories = await Category.find();
    console.log(JSON.stringify(categories, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}
check();
