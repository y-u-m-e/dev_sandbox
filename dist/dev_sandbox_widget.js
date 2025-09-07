/* dev_sandbox_widget.js

 *
 * Features:
 *  - This is a template for how to create CDN html & JS implementation to be able to be loaded on a Carrd webpage
 *
 * Carrd usage (Embed → Code):
 * <div id="dev-sandbox-root"></div>
 * <script src="https://cdn.jsdelivr.net/gh/USER/REPO@<TAG_OR_COMMIT>/dist/dev_sandbox_widget.js"></script>
 * 
 * 
 * Example: (For this Sandbox)

<div id="dev-sandbox-root"></div>
<script>
(function () {
    const s = document.createElement('script');
    s.src = "https://cdn.jsdelivr.net/gh/y-u-m-e/dev_sandbox@{ADD COMMIT HASH HERE}/dist/dev_sandbox_widget.js";
    s.onload = () => {
        if (window.SandboxWidget) {
            console.log("SandboxWidget OK, mounting…");
            SandboxWidget.mount('#dev-sandbox-root');
        } else {
            console.error("SandboxWidget not found on window");
        }
    };
    s.onerror = () => console.error("Failed to load widget script.");
    (document.head || document.body).appendChild(s);
})();
</script>

 */

    /**
     * ---- CORE FUNCTION ----
     * -----------------------
     * |    UMD wrapper      |
     * -----------------------
     * used to make the  html browser agnostic
     */
(function (root, factory) {
  var g = typeof globalThis !== 'undefined' ? globalThis
        : typeof window !== 'undefined' ? window
        : root;

  var mod = factory();
  g.SandboxWidget = mod;

  if (typeof define === 'function' && define.amd) {
    define([], function () { return mod; });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  }
})(this, function () {
  const CSS_ID = 'dev-sandbox-widget-styles';

  const STYLE = `
    #dev-sandbox-template {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 500px;
      margin: 30px auto;
      text-align: center;
    }
    #dev-sandbox-template h3 {
      margin-bottom: 15px;
    }
    #dev-sandbox-template input {
      padding: 10px;
      font-size: 16px;
      width: 80%;
      max-width: 300px;
      margin: 10px auto;
      display: block;
      border: 1px solid #ccc;
      border-radius: 5px;
    }
    #dev-sandbox-template button {
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      background: #8e9296;
      color: white;
      border-radius: 5px;
      cursor: pointer;
    }
    #dev-sandbox-template button:hover {
      background: #80b5eb;
    }
    #lookup-result {
      font-weight: bold;
      margin-top: 15px;
      min-height: 1.2em;
    }
  `;

  const HTML = `
    <div id="dev-sandbox-template">
      <h3>OSRS Player Lookup</h3>
      <input id="osrs-username" type="text" placeholder="Enter OSRS username" />
      <button id="lookupBtn">Look Up XP Gain (Last 30 Days)</button>
      <p id="lookup-result"></p>
    </div>
  `;

  function injectStyles(doc) {
    if (doc.getElementById(CSS_ID)) return;
    const style = doc.createElement('style');
    style.id = CSS_ID;
    style.textContent = STYLE;
    doc.head.appendChild(style);
  }

  function wire(host, opts) {
    const input = host.querySelector('#osrs-username');
    const button = host.querySelector('#lookupBtn');
    const result = host.querySelector('#lookup-result');

    async function fetchPlayerXP30Days(username) {
      if (!username || !username.trim()) {
        result.textContent = 'Please enter a valid username.';
        return;
      }

      const encoded = encodeURIComponent(username.trim());

      try {
        result.textContent = 'Loading player data...';

        // 1. Fetch player info to get player id
        const playerRes = await fetch(`https://api.wiseoldman.net/v2/players/${encoded}`);
        if (!playerRes.ok) {
          result.textContent = 'Player not found or API error.';
          return;
        }
        const playerData = await playerRes.json();
        const playerId = playerData.id;

        // 2. Fetch snapshots for that player
        result.textContent = 'Loading snapshots...';

        const snapsRes = await fetch(`https://api.wiseoldman.net/v2/players/${playerId}/snapshots?limit=100`);
        if (!snapsRes.ok) {
          result.textContent = 'Failed to fetch snapshots.';
          return;
        }
        const snapsData = await snapsRes.json();
        const snapshots = snapsData.data;

        if (!snapshots.length) {
          result.textContent = 'No snapshots available for this player.';
          return;
        }

        // 3. Filter snapshots from last 30 days
        const now = new Date();
        const days30ago = new Date(now);
        days30ago.setDate(days30ago.getDate() - 30);

        const recentSnapshots = snapshots
          .filter(snap => new Date(snap.createdAt) >= days30ago)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (recentSnapshots.length < 2) {
          result.textContent = 'Not enough snapshots in the last 30 days to calculate XP gain.';
          return;
        }

        // 4. Calculate total XP difference between earliest and latest snapshot
        const firstSkills = recentSnapshots[0].data.skills;
        const lastSkills = recentSnapshots[recentSnapshots.length - 1].data.skills;

        const sumXP = skills => Object.values(skills).reduce((acc, skill) => acc + (skill.xp || 0), 0);

        const xpStart = sumXP(firstSkills);
        const xpEnd = sumXP(lastSkills);

        const xpGained = xpEnd - xpStart;

        if (xpGained < 0) {
          result.textContent = 'XP gain calculation error (negative value).';
          return;
        }

        result.textContent = `${username} has gained ${xpGained.toLocaleString()} XP in the last 30 days.`;
      } catch (err) {
        console.error(err);
        result.textContent = 'An error occurred while fetching data.';
      }
    }

    button.addEventListener('click', () => {
      fetchPlayerXP30Days(input.value);
    });
  }

  function mount(selectorOrEl, opts) {
    const host = (typeof selectorOrEl === 'string') ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!host) return;
    injectStyles(document);
    host.innerHTML = HTML;
    wire(host, opts || {});
  }

  return { mount };
});
