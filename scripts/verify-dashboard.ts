
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function verify() {
    try {
        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            username: 'admin',
            password: '123456'
        });
        const token = loginRes.data.token;
        console.log('   -> Login Success! Token:', token.substring(0, 10) + '...');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Initial Stats
        console.log('2. Checking Initial Stats...');
        const startStats = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        console.log('   -> Profiles:', startStats.data.data.profiles);
        console.log('   -> Proxies:', startStats.data.data.proxies);

        // 3. Create Profile
        console.log('3. Creating Test Profile...');
        await axios.post(`${API_URL}/profiles`, { name: 'Auto Test Profile' }, { headers });
        console.log('   -> Profile Created!');

        // 4. Create Proxy
        console.log('4. Creating Test Proxy...');
        await axios.post(`${API_URL}/proxies`, { host: '1.1.1.1', port: 8080, type: 'http' }, { headers });
        console.log('   -> Proxy Created!');

        // 5. Verify Stats Increment
        console.log('5. Verifying Stats Update...');
        const endStats = await axios.get(`${API_URL}/dashboard/stats`, { headers });
        console.log('   -> Profiles:', endStats.data.data.profiles);
        console.log('   -> Proxies:', endStats.data.data.proxies);

        if (endStats.data.data.profiles > startStats.data.data.profiles &&
            endStats.data.data.proxies > startStats.data.data.proxies) {
            console.log('✅ TEST PASSED: Dashboard updated correctly!');
        } else {
            console.error('❌ TEST FAILED: Stats did not increment.');
        }

    } catch (error: any) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

verify();
