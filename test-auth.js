// Test authentication and challenges API
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test registration
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (!registerResponse.ok) {
      console.log('User might already exist, trying login...');
    }
    
    // Test login
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginResponse.ok && loginData.token) {
      console.log('✅ Authentication successful!');
      
      // Test challenges API
      const challengesResponse = await fetch(`${API_BASE}/challenges/user/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const challengesData = await challengesResponse.json();
      console.log('Challenges response:', challengesData);
      
      if (challengesResponse.ok) {
        console.log('✅ Challenges API working!');
      } else {
        console.log('❌ Challenges API failed:', challengesData);
      }
    } else {
      console.log('❌ Authentication failed:', loginData);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAuth();
