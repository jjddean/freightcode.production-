import axios from 'axios';

const SEARATES_KEY = 'K-BEEBD969-8265-41EB-A28B-E7E008650BA4';
const SEARATES_ID = '38163';

async function introspect() {
  const tokenUrl = `https://www.searates.com/auth/platform-token?id=${SEARATES_ID}&api_key=${SEARATES_KEY}`;
  const tokenRes = await axios.get(tokenUrl);
  const token = tokenRes.data['s-token'];
  const graphqlUrl = 'https://rates.searates.com/graphql';

  const query = `
    query {
      __schema {
        queryType {
          fields {
            name
            type {
              name
              kind
              ofType {
                name
                kind
                ofType {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  try {
    const res = await axios.post(graphqlUrl, { query }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    const fields = res.data.data?.__schema?.queryType?.fields || [];
    const ratesField = fields.find(f => f.name === 'rates');

    if (!ratesField) {
      console.log('Rates field not found in Query type.');
      console.log('Available Query fields:', fields.map(f => f.name));
      return;
    }

    console.log('Rates field found.');

    // Traverse to find the named type
    let currentType = ratesField.type;
    while (currentType.ofType) {
      currentType = currentType.ofType;
    }
    const typeName = currentType.name;
    console.log(`Return type of rates: ${typeName}`);

    // Now introspect that type
    const typeQuery = `
        query {
          __type(name: "${typeName}") {
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
        `;
    const typeRes = await axios.post(graphqlUrl, { query: typeQuery }, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    const typeFields = typeRes.data.data?.__type?.fields || [];
    console.log(`\nFields for ${typeName}:`);
    typeFields.forEach(f => {
      let ft = f.type.name || f.type.ofType?.name || f.type.kind;
      console.log(`- ${f.name} (${ft})`);
    });

  } catch (e) {
    console.log('Error:', e.message);
  }
}
introspect();
