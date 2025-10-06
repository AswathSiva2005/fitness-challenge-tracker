// Test multi-user challenges functionality
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testMultiUserChallenges() {
  try {
    console.log('Testing multi-user challenges...');
    
    // Create two test users
    const users = [];
    
    for (let i = 1; i <= 2; i++) {
      const username = `testuser${i}`;
      const password = 'testpass123';
      
      // Register user
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
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
        console.log(`✅ User ${username} created and logged in`);
      }
    }
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing');
      return;
    }
    
    // User 1 creates a challenge
    console.log('\n--- User 1 creating a challenge ---');
    const challengeData = {
      title: 'Test Challenge for All Users',
      description: 'This is a test challenge that should be visible to all users',
      challengeType: 'steps',
      targetValue: 10000,
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
      console.log('✅ Challenge created by user 1:', challenge.challenge.title);
      
      // User 2 should be able to see the challenge
      console.log('\n--- User 2 viewing challenges ---');
      const viewResponse = await fetch(`${API_BASE}/challenges`, {
        headers: {
          'Authorization': `Bearer ${users[1].token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (viewResponse.ok) {
        const challenges = await viewResponse.json();
        console.log('✅ User 2 can see challenges:', challenges.data.length, 'challenges found');
        
        if (challenges.data.length > 0) {
          const firstChallenge = challenges.data[0];
          console.log('Challenge details:', {
            title: firstChallenge.title,
            createdBy: firstChallenge.createdBy?.username,
            participants: firstChallenge.participants?.length || 0
          });
        }
      } else {
        console.log('❌ User 2 cannot view challenges');
      }
      
      // User 2 joins the challenge
      console.log('\n--- User 2 joining challenge ---');
      const joinResponse = await fetch(`${API_BASE}/challenges/${challenge.challenge._id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${users[1].token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (joinResponse.ok) {
        console.log('✅ User 2 joined the challenge');
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

testMultiUserChallenges();
