// Test the fixed join challenge functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testJoinChallenge() {
  try {
    console.log('Testing join challenge functionality...');
    
    // Create two test users
    const users = [];
    
    for (let i = 1; i <= 2; i++) {
      const username = `testuser${i}`;
      const password = 'testpass123';
      
      // Try to register user (might already exist)
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      // Login user
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        users.push({
          username,
          token: loginData.token,
          userId: loginData.userId
        });
        console.log(`✅ User ${username} logged in`);
      }
    }
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing');
      return;
    }
    
    // User 1 creates a challenge
    console.log('\n--- User 1 creating a challenge ---');
    const challengeData = {
      title: 'Test Join Challenge',
      description: 'Testing the join functionality',
      challengeType: 'steps',
      targetValue: 5000,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      isPublic: true
    };
    
    const createResponse = await fetch(`${API_BASE}/challenges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${users[0].token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(challengeData)
    });
    
    if (createResponse.ok) {
      const challenge = await createResponse.json();
      console.log('✅ Challenge created:', challenge.challenge.title);
      
      // User 2 joins the challenge
      console.log('\n--- User 2 joining challenge ---');
      const joinResponse = await fetch(`${API_BASE}/challenges/${challenge.challenge._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${users[1].token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Join response status:', joinResponse.status);
      
      if (joinResponse.ok) {
        const joinData = await joinResponse.json();
        console.log('✅ User 2 successfully joined the challenge!');
        console.log('Response:', joinData.message);
        
        // Check if notification was created for user 1
        console.log('\n--- Checking notifications for User 1 ---');
        const notificationResponse = await fetch(`${API_BASE}/notifications`, {
          headers: {
            'Authorization': `Bearer ${users[0].token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (notificationResponse.ok) {
          const notifications = await notificationResponse.json();
          console.log('✅ Notifications found:', notifications.data.length);
          if (notifications.data.length > 0) {
            console.log('Latest notification:', notifications.data[0].message);
          }
        }
        
      } else {
        const error = await joinResponse.json();
        console.log('❌ User 2 could not join challenge:', error);
      }
      
    } else {
      const error = await createResponse.json();
      console.log('❌ Failed to create challenge:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testJoinChallenge();
