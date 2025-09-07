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
 * 
 * <div id="dev-sandbox-root"></div>
 * <script src="https://cdn.jsdelivr.net/gh/y-u-m-e/dev_sandbox@live/dist/dev_sandbox_widget.js"></script>
 * 
 */

    /**
     * ---- CORE FUNCTION ----
     * -----------------------
     * |    UMD wrapper      |
     * -----------------------
     * used to make the  html browser agnostic
     */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DevSandboxWidget = factory();
  }
})(this, function () {
  const CSS_ID = 'dev-sandbox-widget-styles';


  // CSS STYLING TO BE INJECTED
  const STYLE = `
    #event-parser { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 20px auto; text-align: center; }
    #event-parser h3, #event-parser h4 { margin-bottom: 15px; }
    #event-parser button { display: block; width: 100%; margin-top: 10px; padding: 10px; font-size: 16px; border: none; background: #8e9296; color: white; border-radius: 5px; cursor: pointer; font-family: 'Segoe UI', sans-serif; }
    #event-parser button:hover { background: #80b5eb; }
    `;

  // HTML ELEMENTS TO BE RENDERED
  const HTML = `
    <div id="dev-sandbox-template">
      <h3>Click Button</h3>
      <button id="copyBtn" type="button">Copy to Clipboard</button>
    </div>
    `;

    /**
     * ---- CORE FUNCTION ----
     * -----------------------
     * | injectStyles(doc)   |
     * -----------------------
     * Adds the widget's CSS rules to the <head> of the page.
     * Uses a unique ID so it only injects once, even if you mount multiple widgets.
     */
  function injectStyles(doc) {
    if (doc.getElementById(CSS_ID)) return; // once
    const style = doc.createElement('style');
    style.id = CSS_ID;
    style.textContent = STYLE;
    doc.head.appendChild(style);
  }
  
    /**
     * ---- CORE FUNCTION ----
     * -----------------------
     * | wire(host, opts)    |
     * -----------------------
     * The main setup function:
     * - Finds all DOM elements inside the widget container.
     * - Defines helper functions to build Discord embeds, extract names, copy output.
     * - Attaches event listeners to the buttons.
     */
  function wire(host, opts) {
    const q = (sel) => host.querySelector(sel);
    const copyBtn = q('#copyBtn');

    /**
     * ----- TEMPLATE FUNCTION -----
     * -----------------------------
     * | copyToClipboard()         |
     * -----------------------------
     * Handler for "Copy to Clipboard" button:
     * - Copies the formatted output to the user’s clipboard.
     * - Uses the modern Clipboard API if available, else falls back to execCommand.
     */
    function copyToClipboard() {
      const textToCopy = 'Template Text that is copied to clipboard';
      if (!navigator.clipboard) {
        const ta = document.createElement('textarea');
        ta.value = textToCopy; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); alert('Copied to clipboard!'); }
        finally { document.body.removeChild(ta); }
        return;
      }

      navigator.clipboard.writeText(textToCopy)
        .then(() => alert('Copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
    }

    copyBtn.addEventListener('click', copyToClipboard);
  }

  /**
   * mount(selectorOrEl, opts)
   * -------------------------
   * Public API function you call to render the widget.
   * - Finds the target container (by selector or element).
   * - Injects styles if not already present.
   * - Inserts the HTML structure.
   * - Calls wire() to attach functionality.
   */
  function mount(selectorOrEl, opts) {
    const host = (typeof selectorOrEl === 'string') ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!host) return;
    injectStyles(document);
    host.innerHTML = HTML;
    wire(host, opts || {});
  }

  return { mount };
});
