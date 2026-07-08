function genId() {
  return Math.random().toString(36).slice(2, 9)
}

const overrides = {
  label:   { text: 'Label', color: 0xFFFFFFFF, w: 55,  h: 25, letterX: 0.60, letterY: 2.3, bgColor: 0x000000FF },
  box:     { text: '_', color: 0xFFFFFFFF, boxColor: 0x111820EE, useBox: true, w: 160, h: 80, letterX: 0.2, letterY: 0.9 },
  sprite:  { text: 'hud:fist', color: 0xFFFFFFFF, font: 4, w: 50,  h: 50 },
  model:   { text: '_', w: 150, h: 100, color: 0xFFFFFFFF, boxColor: 0x000000DD,
             modelId: 411, modelZoom: 1.0, modelRotX: 0, modelRotY: 0, modelRotZ: 0,
             modelColor1: 0, modelColor2: 0 },
}

export function makeElement(type, x = 255, y = 190)
{
  const id = genId()
  const base = {
    id, type,
    name: `${type}_${id.slice(0, 4)}`,
    visible: true, locked: false, layer: 0, isPlayer: true,
    color: 0xFFFFFFFF, boxColor: 0x000000AA, bgColor: 0x00000080,
    font: 0, selectable: false, useBox: false, proportional: true,
    outline: 0, shadow: 0, align: 0,
    letterX: 0.2, letterY: 0.9,
    textSizeX: 0, textSizeY: 0,
    x, y, w: 100, h: 20, text: '_',
  }

  const el = { ...base, ...(overrides[type] || {}), type }

  if (el.align === 1) {
    el.textSizeX = 0
    el.textSizeY = el.w * 1.08125
  } else if (el.align === 2) {
    el.textSizeX = el.x
    el.textSizeY = el.h
  } else {
    el.textSizeX = el.x + el.w
    el.textSizeY = el.h
  }

  return el
}