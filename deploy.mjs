import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const config = {
  host: process.env.DEPLOY_HOST,
  port: Number(process.env.DEPLOY_PORT || 22),
  username: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASSWORD,
  readyTimeout: 30000,
};

const REMOTE_DIR = process.env.DEPLOY_REMOTE_DIR || '/var/www/visual-vision';
const LOCAL_DIST = './dist';

if (!config.host || !config.username || !config.password) {
  console.error('Missing DEPLOY_HOST, DEPLOY_USER, or DEPLOY_PASSWORD.');
  process.exit(1);
}

function runCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '', stderr = '';
      stream.on('close', (code) => {
        if (code !== 0) {
          console.error(`  [stderr] ${stderr}`);
          reject(new Error(`Command failed (code ${code}): ${cmd}`));
        } else {
          resolve(stdout);
        }
      });
      stream.on('data', (d) => { process.stdout.write(d); stdout += d; });
      stream.stderr.on('data', (d) => { process.stderr.write(d); stderr += d; });
    });
  });
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function sudoCommand(cmd) {
  return `printf '%s\\n' ${shellEscape(config.password)} | sudo -S ${cmd}`;
}

function uploadDir(sftp, localDir, remoteDir) {
  return new Promise(async (resolve, reject) => {
    try {
      const entries = fs.readdirSync(localDir);
      for (const entry of entries) {
        const localPath = path.join(localDir, entry);
        const remotePath = remoteDir + '/' + entry;
        const stat = fs.statSync(localPath);
        if (stat.isDirectory()) {
          await mkdirSftp(sftp, remotePath);
          await uploadDir(sftp, localPath, remotePath);
        } else {
          await uploadFile(sftp, localPath, remotePath);
        }
      }
      resolve();
    } catch (e) { reject(e); }
  });
}

function mkdirSftp(sftp, remotePath) {
  return new Promise((resolve) => {
    sftp.mkdir(remotePath, () => resolve());
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else { console.log(`  Uploaded: ${remotePath}`); resolve(); }
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('Connected to server');
  try {
    console.log('\n[0] Preparing remote directory...');
    await runCommand(
      conn,
      `${sudoCommand(`mkdir -p ${shellEscape(REMOTE_DIR)}`)} && ${sudoCommand(`chown -R ${shellEscape(config.username)}:${shellEscape(config.username)} ${shellEscape(REMOTE_DIR)}`)}`
    );

    console.log('\n[1] Uploading build files...');
    await new Promise((resolve, reject) => {
      conn.sftp(async (err, sftp) => {
        if (err) return reject(err);
        await mkdirSftp(sftp, REMOTE_DIR);
        await uploadDir(sftp, LOCAL_DIST, REMOTE_DIR);
        sftp.end();
        resolve();
      });
    });

    console.log('\n[2] Restarting nginx...');
    await runCommand(conn, sudoCommand('systemctl restart nginx'));

    console.log('\n✓ Deployment complete!');
    console.log(`  Site: http://${config.host}`);
  } catch (err) {
    console.error('Deployment failed:', err.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
}).connect(config);
