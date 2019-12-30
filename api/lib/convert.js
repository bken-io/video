const api = require('./api');
const path = require('path');
const util = require('util');
const uuid = require('uuid');
const fs = require('fs-extra');
const mime = require('mime-types');
const s3 = require('../config/s3');

const { exec } = require('child_process');

const BUCKET_NAME = 'media-bken';
const execProm = util.promisify(exec);

const commandArrayToObj = (string) => {
  return string.split('\n').reduce((acc, cv) => {
    const [key, value] = cv.split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
};

const streamingExec = (cmd, meta) => {
  return new Promise((resolve, reject) => {
    const cmdStream = exec(cmd);
    cmdStream.stderr.on('data', console.error);
    cmdStream.stdout.on('data', (data) => {
      const split = data.split('\n');
      if (split.some((v) => v.indexOf('frame') >= 0)) {
        const stats = commandArrayToObj(data);
        const fileDuration = meta.duration;
        const secondsProcessed = stats.out_time_ms / 1000 / 1000;

        const timeRemaining =
          (fileDuration - secondsProcessed) /
          parseFloat(stats.speed.split('x'));

        const percentComplete = (
          (secondsProcessed / fileDuration) *
          100
        ).toFixed(2);

        console.log('percentComplete', percentComplete);
        console.log('time remaining', timeRemaining);
      }
    });
    cmdStream.on('exit', (code) => {
      code === 0 ? resolve(code) : reject(code);
    });
  });
};

class Conversion {
  constructor(id, sourceFile) {
    this.id = id;
    this.sourceFile = `${path.resolve(sourceFile)}`;
    this.outPath = `${path.resolve(`./tmp/${uuid()}`)}`;
    this.commands = `ffmpeg -i ${this.sourceFile}`;
  }

  pre(commands) {
    const splitCommands = this.commands.split('ffmpeg')[1];
    this.commands = `ffmpeg ${commands} ${splitCommands}`;
    return this;
  }

  add(commands) {
    this.commands = `${this.commands} ${commands}`;
    return this;
  }

  async metadata() {
    const { stdout } = await execProm(
      `ffprobe -v error -show_format -show_streams ${this.sourceFile}`
    );

    return commandArrayToObj(stdout);
  }

  async process(fileName) {
    try {
      if (!fileName)
        throw new Error('fileName must be provided as first argument');

      const startTime = Date.now();
      const outFilePath = `${this.outPath}/${fileName}`;
      await fs.mkdirp(this.outPath);

      console.log(this.commands);

      await streamingExec(
        `${this.commands} ${outFilePath}`,
        await this.metadata()
      );

      const s3Res = await s3
        .upload({
          Bucket: BUCKET_NAME,
          Key: `${this.id}/${fileName}`,
          ContentType: mime.lookup(fileName),
          Body: fs.createReadStream(outFilePath),
        })
        .promise();

      await api({
        method: 'patch',
        url: `/videos/${this.id}`,
        data: {
          media: {
            [fileName.split('.')[0]]: s3Res.Location,
          },
        },
      });

      await fs.remove(this.outPath);
      console.log(`time to complete = ${Date.now() - startTime}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

class CustomConversion {
  constructor(id) {
    this.id = id;
    this.sourceFile = `${path.resolve(sourceFile)}`;
    this.outPath = `${path.resolve(`./tmp/${uuid()}`)}`;
    this.commands = `ffmpeg -i ${this.sourceFile}`;
  }

  config(commands) {
    this.commands = `${this.commands} ${commands}`;
    return this;
  }

  async metadata() {
    const { stdout } = await execProm(
      `ffprobe -v error -show_format -show_streams ${this.sourceFile}`
    );

    return commandArrayToObj(stdout);
  }

  async process() {
    try {
      const startTime = Date.now();
      const outFilePath = `${this.outPath}/${fileName}`;
      await fs.mkdirp(this.outPath);

      console.log(this.commands);

      await streamingExec(
        `ffmpeg -i ${this.url} ${this.commands} ${outFilePath}`,
        await this.metadata()
      );

      const s3Res = await s3
        .upload({
          Bucket: BUCKET_NAME,
          Key: `${this.id}/${fileName}`,
          ContentType: mime.lookup(fileName),
          Body: fs.createReadStream(outFilePath),
        })
        .promise();

      await api({
        method: 'patch',
        url: `/videos/${this.id}`,
        data: {
          media: {
            [fileName.split('.')[0]]: s3Res.Location,
          },
        },
      });

      await fs.remove(this.outPath);
      console.log(`time to complete = ${Date.now() - startTime}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = Conversion;
