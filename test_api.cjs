const axios = require('axios');

async function test() {
  try {
    const loginResp = await axios.post('http://localhost:8081/user/login', {
      email: 'supun',
      password: '11111111'
    });
    const token = loginResp.data.token || loginResp.data.jwt;
    
    const qtyResp = await axios.get('http://localhost:8081/stockes/stockQty', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(JSON.stringify(qtyResp.data, null, 2));
  } catch (e) {
    console.log('Login with supun failed, trying piyumal');
    try {
      const loginResp2 = await axios.post('http://localhost:8081/user/login', {
        email: 'piyumal',
        password: '1234'
      });
      const token = loginResp2.data.token || loginResp2.data.jwt;
      
      const qtyResp = await axios.get('http://localhost:8081/stockes/stockQty', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(JSON.stringify(qtyResp.data, null, 2));
    } catch (e2) {
      console.error(e2.message);
    }
  }
}

test();
