require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const exists = await User.findOne({ role: 'admin' });
    if (exists) {
      console.log('Admin already exists:', exists.email);
    } else {
      const admin = await User.create({
        name: 'Site Admin',
        email: 'admin@kavyakala.app',
        handle: 'admin',
        password: 'ChangeMe@123',
        role: 'admin'
      });
      console.log('✅ Admin created:', admin.email);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
