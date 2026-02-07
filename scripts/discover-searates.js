import axios from 'axios';

const SEARATES_KEY = 'K-BEEBD969-8265-41EB-A28B-E7E008650BA4';
const SEARATES_ID = '38163';

async function discover() {
    const tokenUrl = `https://www.searates.com/auth/platform-token?id=${SEARATES_ID}&api_key=${SEARATES_KEY}`;
    const tokenRes = await axios.get(tokenUrl);
    const token = tokenRes.data['s-token'];
    const graphqlUrl = 'https://rates.searates.com/graphql';

    const query = `query { 
      rates(shippingType: LCL, coordinatesFrom: [31.23, 121.47], coordinatesTo: [33.75, -118.19], weight: 100) { 
        points {
          location {
            name
          }
        }
      } 
    }`;

    console.log('Testing: points only');
    try {
        const res = await axios.post(graphqlUrl, { query }, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
}
discover();
