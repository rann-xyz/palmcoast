import { BEACH, GRID, ROAD, WORLD } from './config.js';
import { randomInt, randomRange } from './util.js';

export const DISTRICTS = {
  beach: { name: 'Sunset Strand', color: '#f7d9a0' },
  marina: { name: 'Marina Row', color: '#f8c8b4' },
  downtown: { name: 'Glassline', color: '#a8c4e2' },
  park: { name: 'Palmetto Park', color: '#8ec5a2' },
  suburbs: { name: 'Costa Verde', color: '#c7d8b2' },
  docks: { name: 'Tiburon Docks', color: '#a5a9b4' },
};

export const STREET_NAMES = [
  ['Vega Avenue', 'Caldera Way', 'Palmetto Road', 'Marisol Street', 'Coral Drive', 'Sunset Avenue', 'Tiburon Road', 'Pierline', 'Osprey Street', 'Cannery Road', 'Golden Hour', 'Vespid Lane'],
  ['First Coast', 'Marina Row', 'Glassline', 'Palmetto Park', 'Costa Verde', 'Sunset Strand', 'Tiburon Docks', 'Cannery Row', 'Osprey Hill', 'Coral Mile', 'Pica Street', 'Furia Way', 'Vista Road', 'Bravo Street'],
];

const SPECIALS = [
  { id: 'safehouse', x: 880, y: 990, label: 'Safehouse' },
  { id: 'police', x: 2310, y: 1320, label: 'Palmcoast PD' },
  { id: 'hospital', x: 1650, y: 2310, label: 'Costa Medical' },
  { id: 'spray', x: 2860, y: 2640, label: 'Respray' },
  { id: 'race', x: 770, y: 2970, label: 'Race Start' },
  { id: 'docks', x: 3740, y: 2310, label: 'Dock Gate' },
  { id: 'pier', x: 1980, y: 3960, label: 'Sunset Pier' },
  { id: 'park', x: 2200, y: 1870, label: 'Palmetto Park' },
];

function districtAt(x, y) {
  if (y >= BEACH.top) return 'beach';
  if (x > 3400) return 'docks';
  if (x > 2400 && y < 1400) return 'downtown';
  if (x < 1200 && y > 1500) return 'marina';
  if (x > 1400 && x < 3000 && y > 1500 && y < 2300) return 'park';
  if (y > 2400) return 'suburbs';
  return 'downtown';
}

function makeBuildings(random) {
  const buildings = [];
  for (let column = 0; column < GRID.columns; column += 1) {
    for (let row = 0; row < GRID.rows; row += 1) {
      const baseX = 100 + column * GRID.pitch;
      const baseY = 100 + row * GRID.pitch;
      const district = districtAt(baseX, baseY);
      if (district === 'beach') continue;
      const count = district === 'park' ? 1 : randomInt(random, 2, 4);
      for (let index = 0; index < count; index += 1) {
        const width = randomRange(random, 62, district === 'downtown' ? 102 : 88);
        const height = randomRange(random, 58, district === 'downtown' ? 96 : 82);
        const x = baseX + randomRange(random, 4, GRID.blockWidth - width - 4);
        const y = baseY + randomRange(random, 4, GRID.blockHeight - height - 4);
        if (district === 'park' && index === 0) {
          buildings.push({ x: baseX + 80, y: baseY + 90, width: 70, height: 54, district, shade: '#f6e2c0', roof: '#d9b98d', heightLevel: 1, landmark: 'Park Pavilion' });
          continue;
        }
        buildings.push({
          x, y, width, height, district,
          shade: district === 'downtown' ? '#b8d2ea' : district === 'marina' ? '#f7c9b6' : district === 'docks' ? '#b7b8ba' : '#e6d7bc',
          roof: district === 'downtown' ? '#8fa9c4' : district === 'marina' ? '#e3a997' : district === 'docks' ? '#8e9094' : '#cbb99b',
          heightLevel: district === 'downtown' ? randomInt(random, 4, 8) : randomInt(random, 1, 3),
          landmark: false,
        });
      }
    }
  }
  for (const special of SPECIALS) {
    buildings.push({ x: special.x - 45, y: special.y - 35, width: 90, height: 70, district: districtAt(special.x, special.y), shade: '#f5e3c2', roof: '#c98d5f', heightLevel: 2, landmark: special.label, special: special.id });
  }
  return buildings;
}

function makeProps(random) {
  const props = [];
  for (let index = 0; index < 320; index += 1) {
    const x = randomRange(random, 70, WORLD.width - 70);
    const y = randomRange(random, 70, BEACH.top - 70);
    const district = districtAt(x, y);
    if (district === 'park' && random() < 0.5) {
      props.push({ x, y, kind: 'palm', size: randomRange(random, 18, 30) });
    } else if (random() < 0.55) {
      props.push({ x, y, kind: 'palm', size: randomRange(random, 15, 26) });
    } else {
      props.push({ x, y, kind: random() < 0.5 ? 'lamp' : 'bench', size: 10 });
    }
  }
  for (let x = 150; x < WORLD.width - 80; x += 108) {
    const side = (x / 108 | 0) % 2 ? 3318 : 3402;
    props.push({ x, y: side, kind: (x / 108 | 0) % 3 ? 'palm' : 'lamp', size: 22 + (x % 37) / 4 });
  }
  for (let index = 0; index < 64; index += 1) {
    const vertical = index % 2 === 1;
    const road = vertical ? 60 + (index % (GRID.columns + 1)) * GRID.pitch : 60 + (index % (GRID.rows + 1)) * GRID.pitch;
    const along = 160 + ((index * 613) % (vertical ? BEACH.top - 320 : WORLD.width - 320));
    const offset = index % 2 ? ROAD.width / 2 + 16 : -(ROAD.width / 2 + 16);
    props.push({ x: vertical ? road + offset : along, y: vertical ? along : road + offset, kind: index % 3 ? 'hydrant' : 'bin', size: 8 });
  }
  return props;
}

function makeBoats(random) {
  const boats = [];
  for (let index = 0; index < 34; index += 1) {
    const shore = index % 2 ? 260 : 4200;
    boats.push({
      x: shore + randomRange(random, -120, 120),
      y: randomRange(random, 3760, 3980),
      angle: randomRange(random, -0.5, 0.5) + (index % 2 ? Math.PI / 2 : -Math.PI / 2),
      length: randomRange(random, 30, 54),
      hull: ['#f8f6f1', '#e9f2f5', '#d9e6ef', '#f4e3c8'][index % 4],
      mast: index % 3 !== 2,
    });
  }
  return boats;
}

export function createCity(seedRandom) {
  const roadsX = [];
  const roadsY = [];
  for (let column = 0; column <= GRID.columns; column += 1) roadsX.push(60 + column * GRID.pitch);
  for (let row = 0; row <= GRID.rows; row += 1) roadsY.push(60 + row * GRID.pitch);
  const buildings = makeBuildings(seedRandom);
  const props = makeProps(seedRandom);
  const boats = makeBoats(seedRandom);
  const nodes = [];
  const edges = [];
  for (let row = 0; row < roadsY.length; row += 1) {
    for (let column = 0; column < roadsX.length; column += 1) {
      nodes.push({ id: nodes.length, x: roadsX[column], y: roadsY[row], column, row, district: districtAt(roadsX[column], roadsY[row]) });
    }
  }
  const nodeAt = (column, row) => nodes[row * roadsX.length + column];
  for (let row = 0; row < roadsY.length; row += 1) {
    for (let column = 0; column < roadsX.length; column += 1) {
      if (column < roadsX.length - 1) edges.push({ from: nodeAt(column, row).id, to: nodeAt(column + 1, row).id, horizontal: true });
      if (row < roadsY.length - 1) edges.push({ from: nodeAt(column, row).id, to: nodeAt(column, row + 1).id, horizontal: false });
    }
  }
  const lights = [];
  for (let row = 1; row < roadsY.length - 1; row += 1) {
    for (let column = 1; column < roadsX.length - 1; column += 1) {
      lights.push({ x: roadsX[column], y: roadsY[row], phase: (column + row) % 2, timer: randomRange(seedRandom, 0, 10) });
    }
  }
  const sidewalkRects = [];
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let column = 0; column < GRID.columns; column += 1) {
      sidewalkRects.push({ x: 100 + column * GRID.pitch - 18, y: 100 + row * GRID.pitch - 18, width: GRID.blockWidth + 36, height: GRID.blockHeight + 36 });
    }
  }
  return {
    roadsX, roadsY, nodes, edges, lights, buildings, props, boats, sidewalkRects,
    specials: SPECIALS, districtAt,
    nearestNode(x, y) {
      const column = Math.max(0, Math.min(GRID.columns, Math.round((x - 60) / GRID.pitch)));
      const row = Math.max(0, Math.min(GRID.rows, Math.round((y - 60) / GRID.pitch)));
      return nodeAt(column, row);
    },
    onRoad(x, y) {
      for (const roadX of roadsX) if (Math.abs(x - roadX) <= ROAD.width / 2) return true;
      for (const roadY of roadsY) if (Math.abs(y - roadY) <= ROAD.width / 2) return true;
      return false;
    },
    isSidewalk(x, y) {
      if (this.onRoad(x, y)) return false;
      for (const rect of sidewalkRects) {
        if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) return true;
      }
      return false;
    },
    lightAt(x, y) {
      let closest = null;
      let best = 90 * 90;
      for (const light of lights) {
        const dx = light.x - x;
        const dy = light.y - y;
        const squared = dx * dx + dy * dy;
        if (squared < best) { best = squared; closest = light; }
      }
      return closest;
    },
  };
}
