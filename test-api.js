// Test script to check API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing /api/servers...');
    const serversResponse = await fetch('http://localhost:3000/api/servers');
    const servers = await serversResponse.json();
    console.log('Servers API works:', servers.length, 'servers');

    console.log('Testing /api/announcements...');
    const announcementsResponse = await fetch('http://localhost:3000/api/announcements');
    const announcements = await announcementsResponse.json();
    console.log('Announcements API works:', announcements.length, 'announcements');

  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI();