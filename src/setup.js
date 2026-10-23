import express from 'express';
import { spawn } from 'child_process';
import { saveToken } from './config.js';

// ── Setup UI HTML ─────────────────────────────────────────────────────────────

const SETUP_HTML = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Discord Lyrics Status — Setup</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #1e1f22; color: #dbdee1;
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .card {
      background: #2b2d31; border-radius: 16px; padding: 36px 40px;
      width: 100%; max-width: 500px; box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .logo { font-size: 32px; margin-bottom: 12px; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .subtitle { font-size: 14px; color: #949ba4; margin-bottom: 28px; }

    .steps {
      background: #1e1f22; border-radius: 10px; padding: 18px 20px;
      margin-bottom: 24px; font-size: 13px; color: #b5bac1; line-height: 2;
    }
    .steps strong { color: #dbdee1; display: block; margin-bottom: 4px; }
    code {
      background: #111214; color: #00b0f4;
      padding: 1px 6px; border-radius: 4px; font-size: 12px;
    }

    label {
      display: block; font-size: 11px; font-weight: 700; letter-spacing: .8px;
      text-transform: uppercase; color: #b5bac1; margin-bottom: 8px;
    }
    .input-wrap { position: relative; }
    input[type=password], input[type=text] {
      width: 100%; padding: 11px 40px 11px 14px;
      background: #1e1f22; border: 1.5px solid #3f4248; border-radius: 8px;
      color: #dbdee1; font-size: 14px; outline: none; transition: border .15s;
    }
    input:focus { border-color: #5865f2; }
    .toggle-vis {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: #949ba4; cursor: pointer; font-size: 16px;
      line-height: 1; padding: 0;
    }
    .toggle-vis:hover { color: #dbdee1; }

    .error { color: #f23f42; font-size: 13px; margin-top: 10px; min-height: 18px; }

    button.save {
      margin-top: 18px; width: 100%; padding: 13px;
      background: #5865f2; border: none; border-radius: 8px;
      color: #fff; font-size: 15px; font-weight: 700; cursor: pointer;
      transition: background .15s, opacity .15s;
    }
    button.save:hover { background: #4752c4; }
    button.save:disabled { opacity: .5; cursor: not-allowed; }

    .note {
      margin-top: 14px; font-size: 12px; color: #6d6f78; text-align: center;
    }

    /* Success state */
    .success {
      display: none; text-align: center; padding: 10px 0;
    }
    .success-icon { font-size: 52px; margin-bottom: 16px; }
    .success h2 { font-size: 20px; color: #23a55a; margin-bottom: 8px; }
    .success p { font-size: 14px; color: #949ba4; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🎵</div>
    <h1>Discord Lyrics Status</h1>
    <p class="subtitle">First-time setup — Enter your Discord User Token to get started.</p>

    <div id="main-form">
      <div class="steps">
        <strong>How to get your User Token:</strong>
        1. Open <code>discord.com/app</code> in your browser<br>
        2. Press <code>F12</code> → go to <strong>Network</strong> tab<br>
        3. Perform any action (e.g., switch servers, send a message)<br>
        4. Click any request → <strong>Request Headers</strong> → find <code>Authorization</code>
      </div>

      <label for="token">Discord User Token</label>
      <div class="input-wrap">
        <input id="token" type="password" placeholder="Paste your token here…" autocomplete="off" spellcheck="false">
        <button class="toggle-vis" type="button" onclick="toggleVis()" title="Show/hide token">👁</button>
      </div>
      <div class="error" id="error"></div>
      <button class="save" id="save-btn" onclick="save()">Save & Start</button>
      <p class="note">Your token is stored locally on your machine and never sent anywhere else.</p>
    </div>

    <div class="success" id="success">
      <div class="success-icon">✅</div>
      <h2>Setup complete!</h2>
      <p>App is running in the background.<br>You can close this window.</p>
    </div>
  </div>

  <script>
    const tokenInput = document.getElementById('token');
    const errorEl   = document.getElementById('error');
    const saveBtn   = document.getElementById('save-btn');

    function toggleVis() {
      tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
    }

    tokenInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });

    async function save() {
      errorEl.textContent = '';
      const token = tokenInput.value.trim();
      if (!token) { errorEl.textContent = 'Please enter a token.'; return; }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Checking…';

      try {
        const res  = await fetch('/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (data.ok) {
          document.getElementById('main-form').style.display = 'none';
          document.getElementById('success').style.display   = 'block';
        } else {
          errorEl.textContent = data.error || 'Unknown error.';
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save & Start';
        }
      } catch {
        errorEl.textContent = 'Could not connect to server. Try again.';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Start';
      }
    }
  </script>
</body>
</html>`;

// ── Setup server ──────────────────────────────────────────────────────────────

/**
 * Opens a local browser setup page and waits until the user saves a valid token.
 * Resolves with the validated token string.
 */
export function runSetup() {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());

    app.get('/', (_req, res) => res.send(SETUP_HTML));

    app.post('/setup', async (req, res) => {
      const { token } = req.body ?? {};

      if (!token || typeof token !== 'string' || token.length < 20) {
        return res.json({ ok: false, error: 'Token is too short or invalid.' });
      }

      // Validate against Discord API
      try {
        const check = await fetch('https://discord.com/api/v9/users/@me', {
          headers: { Authorization: token },
        });
        if (check.status === 401) {
          return res.json({ ok: false, error: 'Invalid token (rejected by Discord). Please check it.' });
        }
        if (!check.ok) {
          return res.json({ ok: false, error: `Discord returned error ${check.status}. Try again later.` });
        }
        const user = await check.json();
        console.log(`[Setup] Token valid — logged in as: ${user.username}`);
      } catch {
        return res.json({ ok: false, error: 'Could not connect to Discord. Check your network.' });
      }

      saveToken(token);
      res.json({ ok: true });

      // Give browser time to show success screen, then shut down server
      setTimeout(() => {
        server.close();
        resolve(token);
      }, 1500);
    });

    let server;
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const url = `http://127.0.0.1:${port}`;
      console.log(`[Setup] Opening browser at ${url}`);

      // Open browser — use cmd /c start on Windows, xdg-open on Linux/macOS
      if (process.platform === 'win32') {
        spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
      } else {
        spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
      }
    });
  });
}
