// src/world/Pathfinder.js — BFS implementation
export class Pathfinder {
  static findPath(map, fromX, fromY, toX, toY, maxDist = 20) {
    const queue = [{ x: fromX, y: fromY, path: [] }];
    const visited = new Set([`${fromX},${fromY}`]);
    while (queue.length) {
      const { x, y, path } = queue.shift();
      if (x === toX && y === toY) return path;
      if (path.length >= maxDist) continue;
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const nx = x+dx, ny = y+dy;
        const key = `${nx},${ny}`;
        if (!visited.has(key) && map.isWalkable(nx, ny)) {
          visited.add(key);
          queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
        }
      }
    }
    return null; // No path found
  }
}
