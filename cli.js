require('dotenv').config();

const axios = require('axios');
const runJob = require('./lib/runJob');
const terminateServer = require('./lib/terminateServer');

(async () => {
  try {
    const args = require('yargs')
      .option('videoId', {
        alias: 'vid',
        type: 'string',
        description: 'The id of the video to process',
        demandOption: true,
      })
      .option('type', {
        alias: 't',
        type: 'string',
        description: 'The preset to use. "all" or "reconvert"',
        demandOption: true,
      }).argv;

    await runJob(args);
  } catch (error) {
    console.error('Error', error);
    const errJson = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    await axios.post(process.env.DISCORD_WEBHOOK_URL, {
      content: `\`\`\`json\n${errJson}\`\`\``,
      username: 'Video Processing Error Bot',
    });
  } finally {
    terminateServer();
  }
})();
