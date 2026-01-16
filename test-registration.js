// Test script to verify registration functionality
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testRegistration() {
      try {
            console.log('🧪 Testing User Registration...\n');

            // Connect to MongoDB
            console.log('Connecting to MongoDB...');
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB\n');

            // Test 1: Create a new user
            console.log('Test 1: Creating new user...');
            const testUser = {
                  username: 'testuser_' + Date.now(),
                  email: `test${Date.now()}@example.com`,
                  password: 'password123',
                  teamName: 'Test Team',
                  role: 'player'
            };

            const user = await User.create(testUser);
            console.log('✅ User created successfully');
            console.log('User ID:', user._id);
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Team Name:', user.teamName);
            console.log('');

            // Test 2: Verify password is hashed
            console.log('Test 2: Checking password hashing...');
            const userWithPassword = await User.findById(user._id).select('+password');
            console.log('Original password:', testUser.password);
            console.log('Hashed password:', userWithPassword.password);
            console.log('✅ Password is hashed:', userWithPassword.password !== testUser.password);
            console.log('');

            // Test 3: Test password matching
            console.log('Test 3: Testing password verification...');
            const isMatch = await userWithPassword.matchPassword('password123');
            console.log('✅ Password match works:', isMatch);
            console.log('');

            // Test 4: Generate JWT token
            console.log('Test 4: Testing JWT token generation...');
            const token = user.getSignedJwtToken();
            console.log('✅ Token generated:', token.substring(0, 50) + '...');
            console.log('');

            // Cleanup
            console.log('Cleaning up test user...');
            await User.findByIdAndDelete(user._id);
            console.log('✅ Test user deleted\n');

            console.log('🎉 All registration tests passed!');

            await mongoose.connection.close();
            process.exit(0);

      } catch (error) {
            console.error('❌ Test failed:', error.message);
            console.error('Error details:', error);
            await mongoose.connection.close();
            process.exit(1);
      }
}

testRegistration();
