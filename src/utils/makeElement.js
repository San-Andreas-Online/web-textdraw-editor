function genId() {
  return Math.random().toString(36).slice(2, 9)
}

const overrides = {
  label:   { text: 'Label', color: 0xFFFFFFFF, w: 55,  h: 25, letterX: 0.60, letterY: 2.3, bgColor: 0x000000FF },
  button:  { text: 'BUTTON', color: 0xFFFFFFFF, boxColor: 0x004400DD, useBox: true, selectable: true, w: 100, h: 25, letterX: 0.50, letterY: 2, font: 2 },
  box:     { text: '_', color: 0xFFFFFFFF, boxColor: 0x111820EE, useBox: true, w: 160, h: 80, letterX: 0.2, letterY: 0.9 },
  sprite:  { text: 'hud:fist', color: 0xFFFFFFFF, font: 4, w: 50,  h: 50 },
}

export function makeElement(type, x = 255, y = 190) {
  const id = genId()
  const base = {
    id,
    type,
    name: `${type}_${id.slice(0, 4)}`,
    visible: true,
    locked: false,
    layer: 0,
    isPlayer: true,
    color: 0xFFFFFFFF,
    boxColor: 0x000000AA,
    bgColor: 0x00000080,
    font: 0,
    selectable: false,
    useBox: false,
    proportional: true,
    outline: 0,
    shadow: 0,
    align: 0,
    letterX: 0.2,
    letterY: 0.9,
    textSizeX: 0,
    textSizeY: 0,
    x,
    y,
    w: 100,
    h: 20,
    text: '_',
  }
  return { ...base, ...(overrides[type] || {}), type }
}