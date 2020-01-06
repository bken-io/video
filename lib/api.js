const axios = require('axios');

const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://api.bken.io'
    : 'http://localhost:3000';

module.exports = async (config) => {
  try {
    config.headers = {
      authorization: process.env.CONVERSION_API_KEY,
      'Content-Type': 'application/json',
    };
    config.url = `${baseUrl}${config.url}`;
    console.log('axios config', JSON.stringify(config, null, 2));
    const res = await axios(config);
    return res;
  } catch (error) {
    console.error('api error', error);
  }
};