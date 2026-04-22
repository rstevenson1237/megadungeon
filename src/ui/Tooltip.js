/**
 * Tooltip — canvas-based detail panel for Menu renderDescription callbacks.
 *
 * Usage:
 *   new Menu('Inventory', items, { renderDescription: Tooltip.forItem() });
 *   new Menu('Spells',    items, { renderDescription: Tooltip.forSpell(SPELLS) });
 *
 * Both factory methods return a function with the signature:
 *   (ctx, menuItem, x, y, w, h, tileH) => void
 * which is exactly what Menu.renderDescription expects.
 */
export class Tooltip {
  static forItem() {
    return (ctx, menuItem, x, y, w, h, tileH) => {
      if (!menuItem?.data) return;
      _renderItemPanel(ctx, menuItem.data, x, y, w, h, tileH);
    };
  }

  static forSpell(spellsDict) {
    return (ctx, menuItem, x, y, w, h, tileH) => {
      if (!menuItem?.data) return;
      const spell = spellsDict[menuItem.data];
      if (!spell) return;
      _renderSpellPanel(ctx, spell, x, y, w, h, tileH);
    };
  }

  static forMonster() {
    return (ctx, menuItem, x, y, w, h, tileH) => {
      if (!menuItem?.data) return;
      _renderMonsterPanel(ctx, menuItem.data, x, y, w, h, tileH);
    };
  }
}

// ---------------------------------------------------------------------------
// Internal renderers
// ---------------------------------------------------------------------------

const SCHOOL_COLORS = {
  evocation:     '#ff6644',
  abjuration:    '#44aaff',
  conjuration:   '#aa44ff',
  divination:    '#44ffcc',
  illusion:      '#ffaa44',
  necromancy:    '#88ff44',
  transmutation: '#ff44aa',
  enchantment:   '#ffff44',
};

function _renderItemPanel(ctx, item, x, y, w, h, tileH) {
  const lineH  = tileH - 1;
  const panelX = x + 8;
  const panelW = w - 16;
  const small  = `${Math.max(9, tileH - 4)}px monospace`;
  const boldF  = `bold ${Math.max(9, tileH - 4)}px monospace`;

  ctx.font = small;

  // Assemble display lines: { text, color, font? }
  const lines = [];

  // Name
  const nameColor = item.cursed
    ? '#ff4444'
    : (item.effects?.length ? '#ffcc44' : (item.color ?? '#cccccc'));
  lines.push({ text: item.name, color: nameColor, font: boldF });

  // Category + special flags
  const flags = [];
  if (item.cursed)                   flags.push('CURSED');
  if (item.weapon?.twoHanded)        flags.push('Two-Handed');
  if (item.tags?.includes('holy'))   flags.push('Holy');
  if (item.tags?.includes('silver')) flags.push('Silver');
  const flagStr = flags.length ? `  [${flags.join(', ')}]` : '';
  lines.push({ text: `${_cap(item.category)}${flagStr}`, color: '#777777' });

  // Type-specific stats
  if (item.weapon) {
    const wp  = item.weapon;
    const atk = wp.attackBonus ? `  Atk ${_sign(wp.attackBonus)}` : '';
    const dmg = wp.damageMod   ? `  Dmg ${_sign(wp.damageMod)}`   : '';
    const rng = wp.range > 1   ? `  Range: ${wp.range}` : '';
    lines.push({
      text:  `Dmg: ${wp.numDice ?? 1}d${wp.die ?? 6}${atk}${dmg}${rng}`,
      color: '#ff9966',
    });
  }

  if (item.armor) {
    const ar     = item.armor;
    const maxDex = ar.maxDexBonus != null ? `  Max Dex: +${ar.maxDexBonus}` : '';
    lines.push({
      text:  `AC Bonus: +${ar.acBonus}  Slot: ${_cap(ar.slot)}  ${maxDex}`,
      color: '#66aaff',
    });
  }

  if (item.potion) {
    const pt  = item.potion;
    const dur = pt.duration ? `  (${pt.duration} turns)` : '';
    lines.push({
      text:  `Effect: ${_cap(pt.effect)}  Magnitude: ${pt.magnitude}${dur}`,
      color: '#88ffaa',
    });
  }

  if (item.scroll) {
    const sc = item.scroll;
    lines.push({
      text:  `Spell: ${sc.spellKey.replace(/_/g, ' ')}  Caster Level: ${sc.casterLevel}`,
      color: '#aa88ff',
    });
  }

  if (item.food) {
    lines.push({ text: `Nutrition: ${item.food.nutrition}`, color: '#ffcc88' });
  }

  if (item.effects?.length) {
    item.effects.forEach(eff =>
      lines.push({ text: `• ${_cap(eff.type)}: ${eff.value}`, color: '#ffcc44' })
    );
  }

  // Description (wrapped, max 3 lines)
  if (item.description) {
    ctx.font = small;
    _wrapText(ctx, item.description, panelW).slice(0, 3).forEach(line =>
      lines.push({ text: line, color: '#aaaaaa' })
    );
  }

  // Weight / value footer
  const parts = [];
  if (item.weight != null) parts.push(`Weight: ${item.weight}`);
  if (item.value  != null) parts.push(`Value: ${item.value} gp`);
  if (parts.length) lines.push({ text: parts.join('  '), color: '#555555' });

  _drawPanel(ctx, lines, x, y, w, h, lineH, panelX, small);
}

function _renderSpellPanel(ctx, spell, x, y, w, h, tileH) {
  const lineH  = tileH - 1;
  const panelX = x + 8;
  const panelW = w - 16;
  const small  = `${Math.max(9, tileH - 4)}px monospace`;
  const boldF  = `bold ${Math.max(9, tileH - 4)}px monospace`;

  ctx.font = small;

  const nameColor = SCHOOL_COLORS[spell.school] ?? '#cccccc';
  const saveStr   = spell.save !== 'none'
    ? `${spell.save} (${spell.saveEffect})`
    : 'none';

  const lines = [
    { text: spell.name, color: nameColor, font: boldF },
    { text: `${_cap(spell.school)} — Level ${spell.level} ${_cap(spell.type)}`, color: '#777777' },
    { text: `Cost: ${spell.mpCost} MP  Range: ${spell.range}  Area: ${spell.area}`, color: '#ffcc44' },
    { text: `Duration: ${spell.duration}  Save: ${saveStr}`, color: '#ffcc44' },
  ];

  if (spell.description) {
    ctx.font = small;
    _wrapText(ctx, spell.description, panelW).slice(0, 2).forEach(line =>
      lines.push({ text: line, color: '#aaaaaa' })
    );
  }

  if (spell.flavorText) {
    lines.push({ text: `"${spell.flavorText}"`, color: '#555577' });
  }

  _drawPanel(ctx, lines, x, y, w, h, lineH, panelX, small);
}

function _renderMonsterPanel(ctx, def, x, y, w, h, tileH) {
  const lineH  = tileH - 1;
  const panelX = x + 8;
  const panelW = w - 16;
  const small  = `${Math.max(9, tileH - 4)}px monospace`;
  const boldF  = `bold ${Math.max(9, tileH - 4)}px monospace`;

  ctx.font = small;

  const alignColor = { lawful: '#88aaff', neutral: '#aaaaaa', chaotic: '#ff8888' };
  const lines = [
    { text: def.name, color: def.color ?? '#cccccc', font: boldF },
    { text: `HD ${def.hd}${def.hdType}  AC ${def.ac}  Size: ${_cap(def.size)}`, color: '#aaaaaa' },
    { text: `Alignment: ${_cap(def.alignment ?? 'neutral')}  Morale: ${def.morale}`,
      color: alignColor[def.alignment] ?? '#aaaaaa' },
    { text: `XP: ${def.xpBase + def.xpPerHD * def.hd}  Speed: ${def.speed ?? 1}`, color: '#ffcc44' },
  ];

  if (def.specials?.length) {
    lines.push({ text: def.specials.slice(0, 3).map(_cap).join(', '), color: '#ff9966' });
  }

  if (def.description) {
    ctx.font = small;
    _wrapText(ctx, def.description, panelW).slice(0, 3).forEach(line =>
      lines.push({ text: line, color: '#aaaaaa' })
    );
  }

  _drawPanel(ctx, lines, x, y, w, h, lineH, panelX, small);
}

// ---------------------------------------------------------------------------
// Shared drawing helpers
// ---------------------------------------------------------------------------

function _drawPanel(ctx, lines, x, y, w, h, lineH, panelX, smallFont) {
  const totalH = lines.length * lineH + lineH;
  // Reserve 1 line at bottom for the Menu's footer hint
  const sepY   = y + h - lineH - totalH;

  // Separator rule
  ctx.fillStyle = '#333355';
  ctx.fillRect(x + 4, sepY - 2, w - 8, 1);

  let dy = sepY + 4;
  lines.forEach(({ text, color, font }) => {
    ctx.fillStyle = color;
    ctx.font = font ?? smallFont;
    ctx.fillText(text, panelX, dy);
    dy += lineH;
  });
}

function _wrapText(ctx, text, maxWidth) {
  if (!text) return [];
  const words   = text.split(' ');
  const result  = [];
  let current   = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      result.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) result.push(current);
  return result;
}

function _cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function _sign(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}
