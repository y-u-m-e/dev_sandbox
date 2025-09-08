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
(function(root, factory) {
  var g = typeof globalThis !== 'undefined' ? globalThis
    : typeof window !== 'undefined' ? window
    : root;
  var mod = factory();
  g.BattleshipWidget = mod;
  if (typeof define === 'function' && define.amd) {
    define([], () => mod);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  }
})(this, function() {
  const CSS_ID = 'battleship-widget-styles';

  const STYLE = `
    /* Container */
    #battleship-root {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 10px auto;
      user-select: none;
    }
    h2 {
      text-align: center;
    }
    /* Ship inventory */
    #ship-inventory {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .ship {
      background: #4a90e2;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      user-select: none;
      border: 2px solid transparent;
    }
    .ship.dragging {
      opacity: 0.5;
    }
    .ship.vertical {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      padding: 10px 5px;
    }

    /* Board */
    #board {
      display: grid;
      grid-template-columns: repeat(10, 30px);
      grid-template-rows: repeat(10, 30px);
      gap: 2px;
      justify-content: center;
      margin-bottom: 10px;
      border: 3px solid #333;
      background: #87ceeb;
      user-select: none;
    }
    .cell {
      width: 30px;
      height: 30px;
      background: #b0c4de;
      border: 1px solid #666;
      cursor: pointer;
      position: relative;
    }
    .cell.ship {
      background: #2c3e50;
    }
    .cell.ship-head::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: gold;
      top: 5px;
      left: 5px;
      border-radius: 50%;
    }
    .cell.hit {
      background: #e74c3c;
    }
    .cell.miss {
      background: #ecf0f1;
    }
    .cell.selected {
      outline: 2px solid yellow;
    }

    /* Controls */
    #controls {
      text-align: center;
      margin-bottom: 10px;
    }
    #ready-btn, #fire-btn {
      padding: 10px 20px;
      margin: 0 10px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: #3498db;
      color: white;
      user-select: none;
    }
    #ready-btn:disabled, #fire-btn:disabled {
      background: #95a5a6;
      cursor: not-allowed;
    }
    #status {
      text-align: center;
      font-weight: bold;
      margin-top: 10px;
      min-height: 1.2em;
    }
  `;

  // Ship definitions
  const SHIPS = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 3 },
    { name: 'Destroyer', size: 2 },
  ];

  // Helper to create element with classes
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function injectStyles(doc) {
    if (doc.getElementById(CSS_ID)) return;
    const style = doc.createElement('style');
    style.id = CSS_ID;
    style.textContent = STYLE;
    doc.head.appendChild(style);
  }

  function mount(selectorOrEl) {
    const host = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!host) return;
    injectStyles(document);
    host.innerHTML = '';
    const root = el('div');
    root.id = 'battleship-root';

    // Title
    const title = el('h2');
    title.textContent = 'Battleship Setup & Firing';

    // Ship Inventory container
    const shipInventory = el('div', 'ship-inventory');
    shipInventory.id = 'ship-inventory';

    // Board container
    const board = el('div');
    board.id = 'board';

    // Controls
    const controls = el('div');
    controls.id = 'controls';
    const readyBtn = el('button');
    readyBtn.id = 'ready-btn';
    readyBtn.textContent = 'Ready';
    readyBtn.disabled = false;
    const fireBtn = el('button');
    fireBtn.id = 'fire-btn';
    fireBtn.textContent = 'Fire (Select 5 tiles)';
    fireBtn.disabled = true;

    // Status display
    const status = el('div');
    status.id = 'status';

    controls.appendChild(readyBtn);
    controls.appendChild(fireBtn);

    root.appendChild(title);
    root.appendChild(shipInventory);
    root.appendChild(board);
    root.appendChild(controls);
    root.appendChild(status);

    host.appendChild(root);

    // === State ===
    // Board cells: 10x10 array storing ship parts or null
    // cellData[r][c] = { shipName, shipIndex, isHead, isHit, isMiss }
    const BOARD_SIZE = 10;
    const cellData = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      cellData[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        cellData[r][c] = null;
      }
    }

    // Ships placement tracking:
    // shipsPlaced = { Carrier: { placed: bool, coords: [] }, ... }
    const shipsPlaced = {};
    SHIPS.forEach(s => {
      shipsPlaced[s.name] = { placed: false, coords: [], orientation: 'horizontal' };
    });

    // Ship drag/drop vars
    let draggingShip = null;
    let draggingOrientation = 'horizontal';

    // Selected tiles for firing
    let selectedShots = [];

    // Is board locked after Ready
    let isReady = false;

    // Initialize Board UI cells
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = el('div', 'cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        board.appendChild(cell);
      }
    }

    // === Build Ship Inventory ===
    SHIPS.forEach(ship => {
      const shipEl = el('div', 'ship');
      shipEl.textContent = `${ship.name} (${ship.size})`;
      shipEl.draggable = true;
      shipEl.dataset.name = ship.name;
      shipEl.dataset.size = ship.size;
      shipEl.dataset.orientation = 'horizontal';

      // Double click to rotate
      shipEl.addEventListener('dblclick', () => {
        if (isReady) return;
        if (shipEl.dataset.orientation === 'horizontal') {
          shipEl.dataset.orientation = 'vertical';
          shipEl.classList.add('vertical');
        } else {
          shipEl.dataset.orientation = 'horizontal';
          shipEl.classList.remove('vertical');
        }
      });

      shipInventory.appendChild(shipEl);
    });

    // === Drag & Drop Handlers ===
    shipInventory.addEventListener('dragstart', e => {
      if (isReady) {
        e.preventDefault();
        return;
      }
      if (e.target.classList.contains('ship')) {
        draggingShip = e.target;
        draggingOrientation = draggingShip.dataset.orientation;
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', draggingShip.dataset.name);
        // To allow drop effect
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    shipInventory.addEventListener('dragend', e => {
      if (draggingShip) draggingShip.classList.remove('dragging');
      draggingShip = null;
    });

    board.addEventListener('dragover', e => {
      if (isReady) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    board.addEventListener('drop', e => {
      if (isReady) return;
      e.preventDefault();
      if (!draggingShip) return;

      const name = draggingShip.dataset.name;
      const size = Number(draggingShip.dataset.size);
      const orientation = draggingOrientation;

      const rect = e.target.getBoundingClientRect();
      const cell = e.target;
      if (!cell.classList.contains('cell')) return;

      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);

      // Validate placement in bounds
      if (
        orientation === 'horizontal' && col + size > BOARD_SIZE ||
        orientation === 'vertical' && row + size > BOARD_SIZE
      ) {
        alert('Ship does not fit in this position!');
        return;
      }

      // Check for overlap with existing ships
      for (let i = 0; i < size; i++) {
        const r = orientation === 'horizontal' ? row : row + i;
        const c = orientation === 'horizontal' ? col + i : col;
        if (cellData[r][c]) {
          alert('Ships cannot overlap!');
          return;
        }
      }

      // Remove previously placed ship (if any)
      if (shipsPlaced[name].placed) {
        shipsPlaced[name].coords.forEach(([r, c]) => {
          cellData[r][c] = null;
          const oldCell = board.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
          if (oldCell) {
            oldCell.classList.remove('ship', 'ship-head');
          }
        });
      }

      // Place the ship
      const coords = [];
      for (let i = 0; i < size; i++) {
        const r = orientation === 'horizontal' ? row : row + i;
        const c = orientation === 'horizontal' ? col + i : col;

        cellData[r][c] = {
          shipName: name,
          shipIndex: i,
          isHead: i === 0,
          isHit: false,
          isMiss: false,
        };

        const cellToMark = board.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (cellToMark) {
          cellToMark.classList.add('ship');
          if (i === 0) cellToMark.classList.add('ship-head');
        }
        coords.push([r, c]);
      }

      shipsPlaced[name] = {
        placed: true,
        coords,
        orientation,
      };

      // Optionally remove the ship from inventory or mark placed
      draggingShip.style.opacity = '0.5';
      draggingShip.draggable = false;

      draggingShip.classList.remove('dragging');
      draggingShip = null;

      updateStatus();
    });

    // Function to update status text
    function updateStatus() {
      const allPlaced = SHIPS.every(s => shipsPlaced[s.name].placed);
      status.textContent = allPlaced ? 'All ships placed! Click "Ready" to lock.' : 'Place all ships by dragging them onto the board.';
      readyBtn.disabled = !allPlaced || isReady;
      fireBtn.disabled = !isReady;
    }

    updateStatus();

    // Ready button locks ship placement
    readyBtn.addEventListener('click', () => {
      if (isReady) return;
      // Double-check all ships placed
      const allPlaced = SHIPS.every(s => shipsPlaced[s.name].placed);
      if (!allPlaced) {
        alert('Please place all ships before readying up.');
        return;
      }
      isReady = true;
      // Disable dragging ships
      const ships = shipInventory.querySelectorAll('.ship');
      ships.forEach(shipEl => {
        shipEl.draggable = false;
        shipEl.style.opacity = '0.5';
      });
      readyBtn.disabled = true;
      fireBtn.disabled = false;
      status.textContent = 'Ready! Select 5 tiles and click "Fire".';
    });

    // Handle tile selection for firing
    board.addEventListener('click', e => {
      if (!isReady) return; // Only after ready
      if (!e.target.classList.contains('cell')) return;

      const cell = e.target;
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);

      // If already hit or miss, can't select
      const cellInfo = cellData[row][col];
      if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;

      // Toggle selection
      if (cell.classList.contains('selected')) {
        cell.classList.remove('selected');
        selectedShots = selectedShots.filter(([r, c]) => !(r === row && c === col));
      } else {
        if (selectedShots.length >= 5) {
          alert('You can only select 5 tiles at a time to fire.');
          return;
        }
        cell.classList.add('selected');
        selectedShots.push([row, col]);
      }

      status.textContent = `Selected ${selectedShots.length} tile(s). Click "Fire" when ready.`;
    });

    // Fire button handler
    fireBtn.addEventListener('click', () => {
      if (selectedShots.length !== 5) {
        alert('Select exactly 5 tiles before firing.');
        return;
      }

      // Mark hits/misses on the board visually
      selectedShots.forEach(([r, c]) => {
        const cell = board.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        const info = cellData[r][c];
        if (info && info.shipName) {
          cell.classList.add('hit');
        } else {
          cell.classList.add('miss');
        }
        cell.classList.remove('selected');
      });

      // Reset selection
      selectedShots = [];
      status.textContent = 'Shots fired! Waiting for opponent...';

      // Disable firing until next turn
      fireBtn.disabled = true;

      // TODO: Here you’d notify your backend/opponent or toggle turn state externally

      // For demo: re-enable fire button after 3 seconds (simulate opponent turn)
      setTimeout(() => {
        fireBtn.disabled = false;
        status.textContent = 'Your turn! Select 5 tiles and fire.';
      }, 3000);
    });
  }

  return { mount };
});
