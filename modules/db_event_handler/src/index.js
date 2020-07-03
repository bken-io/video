const AWS = require('aws-sdk');
const axios = require('axios');

const db = new AWS.DynamoDB.DocumentClient({ region: 'us-east-2' });
const { CDN_BUCKET, TIDAL_BUCKET } = process.env;

module.exports.handler = async ({ Records }) => {
  for (const event of Records) {
    console.log(JSON.stringify(event));
    const item = AWS.DynamoDB.Converter.unmarshall(event.dynamodb.NewImage);

    if (item.status === 'segmenting') {
      const transcoded = Object.values(item.segments).reduce((acc, cv) => {
        if (cv) acc++;
        return acc;
      }, 0);

      if (
        item.segmentCount === transcoded &&
        Object.keys(item.audio).length >= 2
      ) {
        const Meta = {
          s3_in: `s3://${TIDAL_BUCKET}/segments/${item.id}/${item.preset}`,
          s3_out: `s3://${CDN_BUCKET}/v/${item.id}/${item.preset}.${item.ext}`,
        };
        const nomadAddr = `http://10.0.3.87:4646/v1/job/concatinating/dispatch`;

        const { Item } = await db
          .get({
            TableName: 'config',
            Key: { id: 'NOMAD_TOKEN' },
          })
          .promise();

        await axios
          .post(
            nomadAddr,
            { Meta },
            {
              headers: {
                'X-Nomad-Token': Item.value,
              },
              timeout: 1000 * 10,
            }
          )
          .catch((error) => {
            console.error(error);
            throw error;
          });
      }
    }
  }
};