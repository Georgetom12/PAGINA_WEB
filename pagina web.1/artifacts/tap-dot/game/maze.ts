export type MazeCell = 0 | 1;

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neighborWalls(g: MazeCell[][], r: number, c: number) {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= g.length || nc < 0 || nc >= g[0].length) {
        count++;
        continue;
      }
      if (g[nr][nc] === 1) count++;
    }
  }
  return count;
}

function smooth(g: MazeCell[][]): MazeCell[][] {
  const rows = g.length;
  const cols = g[0].length;
  const next: MazeCell[][] = [];
  for (let r = 0; r < rows; r++) {
    next[r] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        next[r][c] = 1;
        continue;
      }
      const w = neighborWalls(g, r, c);
      if (w >= 5) next[r][c] = 1;
      else if (w <= 3) next[r][c] = 0;
      else next[r][c] = g[r][c];
    }
  }
  return next;
}

function clearArea(
  g: MazeCell[][],
  cx: number,
  cy: number,
  radius: number,
) {
  const rows = g.length;
  const cols = g[0].length;
  for (let r = cy - radius; r <= cy + radius; r++) {
    for (let c = cx - radius; c <= cx + radius; c++) {
      if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) {
        g[r][c] = 0;
      }
    }
  }
}

export function generateMaze(
  cols: number,
  rows: number,
  seed = Date.now(),
): MazeCell[][] {
  const rng = mulberry32(seed);
  let grid: MazeCell[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        grid[r][c] = 1;
      } else {
        grid[r][c] = rng() < 0.42 ? 1 : 0;
      }
    }
  }

  for (let i = 0; i < 5; i++) grid = smooth(grid);

  // Clear player + bot start area (bottom of map)
  const cx = Math.floor(cols / 2);
  const sy = rows - 3;
  clearArea(grid, cx, sy, 2);
  clearArea(grid, Math.max(2, cx - 4), sy, 1);
  clearArea(grid, Math.min(cols - 3, cx + 4), sy, 1);

  // Drill some random connection corridors so the map is navigable
  for (let i = 0; i < 6; i++) {
    const horiz = rng() < 0.5;
    if (horiz) {
      const r = 2 + Math.floor(rng() * (rows - 4));
      for (let c = 1; c < cols - 1; c++) {
        if (rng() < 0.78) grid[r][c] = 0;
      }
    } else {
      const c = 2 + Math.floor(rng() * (cols - 4));
      for (let r = 1; r < rows - 1; r++) {
        if (rng() < 0.78) grid[r][c] = 0;
      }
    }
  }

  // Re-clear start area in case corridors covered it
  clearArea(grid, cx, sy, 2);

  return grid;
}
