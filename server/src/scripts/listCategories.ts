import '../config/env';
import { connectDatabase } from '../config/database';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

async function list() {
  try {
    await connectDatabase();
    const categories = await Category.find();
    console.log('---CATEGORIES_START---');
    console.log(JSON.stringify(categories));
    console.log('---CATEGORIES_END---');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}
list();
