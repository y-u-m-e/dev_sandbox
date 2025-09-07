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
        result.textContent = 'Loading player XP gain...';

        const res = await fetch(`https://api.wiseoldman.net/v2/players/${encoded}/gained?period=month`);
        if (!res.ok) {
          result.textContent = 'Player not found or API error.';
          return;
        }

        const data = await res.json();
        const xpGained = data.data?.skills?.overall?.experience?.gained;

        if (typeof xpGained === 'number' && xpGained > 0) {
          result.textContent = `${username} has gained ${xpGained.toLocaleString()} XP in the last 30 days.`;
        } else {
          result.textContent = `${username} has no XP gain in the last 30 days.`;
        }
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

