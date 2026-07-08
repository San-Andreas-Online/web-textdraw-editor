import { numToHex8 } from './colors'

function calcTextSize(el) {
  if (el.type === 'sprite') {
    return { tx: el.w, ty: el.h }
  }
  const rightY = el.y + el.h
  if (el.align === 1) return { tx: 0, ty: el.w }
  if (el.align === 2) return { tx: el.x - 5.0, ty: rightY }
  if (el.textSizeX > 0 || el.textSizeY > 0) {
    return { tx: el.textSizeX, ty: el.textSizeY }
  }
  return { tx: el.x + el.w - 5.0, ty: rightY }
}

function scaleEl(el) {
  const sx = 640 / 592
  const x = el.x * sx
  return {
    ...el,
    x,
    y: el.y - 3,
    w: el.w * sx,
    h: el.h,
    textSizeX: el.textSizeX * sx,
    textSizeY: el.textSizeY,
  }
}

export function exportPawn(els, prefix) {
  const sorted = [...els].sort((a, b) => (a.layer || 0) - (b.layer || 0))
  const globals = sorted.filter(e => !e.isPlayer)
  const players = sorted.filter(e => e.isPlayer)

  const now = new Date()
  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const lines = [`// TextDraw Designer sa-mp | ${date}, ${time}`, '']

  if (globals.length) {
    lines.push(`new Text:${prefix}_global[${globals.length}];`)
  }
  if (players.length) {
    lines.push(`new PlayerText:${prefix}_player[MAX_PLAYERS][${players.length}];`)
  }
  lines.push('')

  lines.push(`stock ${prefix}_Create(playerid) \n{`)

  globals.forEach((el, i) => {
    el = scaleEl(el)
    const ref = `${prefix}_global[${i}]`
    const txt = (el.text || '_').replace(/"/g, '\\"')
    const col = numToHex8(el.color)
    const box = numToHex8(el.boxColor)
    const bg  = numToHex8(el.bgColor ?? 0x00000080)

    lines.push(`    // ${el.name} (${el.type})`)

    if (el.type === 'sprite') {
      lines.push(`    ${ref} = TextDrawCreate(${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "${txt}");`)
      lines.push(`    TextDrawFont(${ref}, 4);`)
      lines.push(`    TextDrawTextSize(${ref}, ${el.w.toFixed(1)}, ${el.h.toFixed(1)});`)
      lines.push(`    TextDrawColour(${ref}, ${col});`)
    } else if (el.type === 'model') {
      lines.push(`    ${ref} = TextDrawCreate(${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "_");`)
      lines.push(`    TextDrawTextSize(${ref}, ${el.w.toFixed(1)}, ${el.h.toFixed(1)});`)
      lines.push(`    TextDrawAlignment(${ref}, 1);`)
      lines.push(`    TextDrawColour(${ref}, ${col});`)
      lines.push(`    TextDrawSetShadow(${ref}, 0);`)
      lines.push(`    TextDrawSetOutline(${ref}, 0);`)
      lines.push(`    TextDrawBackgroundColour(${ref}, ${box});`)
      lines.push(`    TextDrawFont(${ref}, 5);`)
      lines.push(`    TextDrawSetProportional(${ref}, false);`)
      lines.push(`    TextDrawSetPreviewModel(${ref}, ${el.modelId ?? 411});`)
      lines.push(`    TextDrawSetPreviewRot(${ref}, ${(el.modelRotX ?? 0).toFixed(3)}, ${(el.modelRotY ?? 0).toFixed(3)}, ${(el.modelRotZ ?? 0).toFixed(3)}, ${(el.modelZoom ?? 1).toFixed(3)});`)
      lines.push(`    TextDrawSetPreviewVehCol(${ref}, ${el.modelColor1 ?? 0}, ${el.modelColor2 ?? 0});`)
    } else {
      lines.push(`    ${ref} = TextDrawCreate(${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "${txt}");`)
      lines.push(`    TextDrawFont(${ref}, ${el.font});`)
      const exportLY = el.h < 0 ? -Math.abs(el.letterY) : el.letterY
      const isLabel = el.type === 'label'
      const exportLX = isLabel && el.w < 0 ? -Math.abs(el.letterX) : el.letterX
      lines.push(`    TextDrawLetterSize(${ref}, ${exportLX.toFixed(3)}, ${exportLY.toFixed(3)});`)
      lines.push(`    TextDrawColour(${ref}, ${col});`)
      lines.push(`    TextDrawAlignment(${ref}, ${el.align + 1});`)
      if (el.useBox) {
        lines.push(`    TextDrawUseBox(${ref}, 1);`)
        lines.push(`    TextDrawBoxColour(${ref}, ${box});`)
        const { tx, ty } = calcTextSize(el)
        lines.push(`    TextDrawTextSize(${ref}, ${tx.toFixed(1)}, ${ty.toFixed(1)});`)
      }
      lines.push(`    TextDrawSetOutline(${ref}, ${el.outline});`)
      lines.push(`    TextDrawSetShadow(${ref}, ${el.shadow});`)
      lines.push(`    TextDrawBackgroundColor(${ref}, ${bg});`)
      if (el.proportional) lines.push(`    TextDrawSetProportional(${ref}, 1);`)
      if (el.selectable)   lines.push(`    TextDrawSetSelectable(${ref}, 1);`)
    }
    lines.push('')
  })

  players.forEach((el, i) => {
    el = scaleEl(el)
    const ref = `${prefix}_player[playerid][${i}]`
    const txt = (el.text || '_').replace(/"/g, '\\"')
    const col = numToHex8(el.color)
    const box = numToHex8(el.boxColor)
    const bg  = numToHex8(el.bgColor ?? 0x00000080)

    lines.push(`    // ${el.name} (${el.type})`)

    if (el.type === 'sprite') {
      lines.push(`    ${ref} = CreatePlayerTextDraw(playerid, ${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "${txt}");`)
      lines.push(`    PlayerTextDrawFont(playerid, ${ref}, 4);`)
      lines.push(`    PlayerTextDrawTextSize(playerid, ${ref}, ${el.w.toFixed(1)}, ${el.h.toFixed(1)});`)
      lines.push(`    PlayerTextDrawColour(playerid, ${ref}, ${col});`)
    } else if (el.type === 'model') {
      lines.push(`    ${ref} = CreatePlayerTextDraw(playerid, ${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "_");`)
      lines.push(`    PlayerTextDrawTextSize(playerid, ${ref}, ${el.w.toFixed(1)}, ${el.h.toFixed(1)});`)
      lines.push(`    PlayerTextDrawAlignment(playerid, ${ref}, 1);`)
      lines.push(`    PlayerTextDrawColour(playerid, ${ref}, ${col});`)
      lines.push(`    PlayerTextDrawSetShadow(playerid, ${ref}, 0);`)
      lines.push(`    PlayerTextDrawSetOutline(playerid, ${ref}, 0);`)
      lines.push(`    PlayerTextDrawBackgroundColour(playerid, ${ref}, ${box});`)
      lines.push(`    PlayerTextDrawFont(playerid, ${ref}, 5);`)
      lines.push(`    PlayerTextDrawSetProportional(playerid, ${ref}, false);`)
      lines.push(`    PlayerTextDrawSetPreviewModel(playerid, ${ref}, ${el.modelId ?? 411});`)
      lines.push(`    PlayerTextDrawSetPreviewRot(playerid, ${ref}, ${(el.modelRotX ?? 0).toFixed(3)}, ${(el.modelRotY ?? 0).toFixed(3)}, ${(el.modelRotZ ?? 0).toFixed(3)}, ${(el.modelZoom ?? 1).toFixed(3)});`)
      lines.push(`    PlayerTextDrawSetPreviewVehCol(playerid, ${ref}, ${el.modelColor1 ?? 0}, ${el.modelColor2 ?? 0});`)
    } else {
      lines.push(`    ${ref} = CreatePlayerTextDraw(playerid, ${el.x.toFixed(1)}, ${el.y.toFixed(1)}, "${txt}");`)
      lines.push(`    PlayerTextDrawFont(playerid, ${ref}, ${el.font});`)
      const exportLY = el.h < 0 ? -Math.abs(el.letterY) : el.letterY
      const isLabel = el.type === 'label' || el.type === 'button'
      const exportLX = isLabel && el.w < 0 ? -Math.abs(el.letterX) : el.letterX
      lines.push(`    PlayerTextDrawLetterSize(playerid, ${ref}, ${exportLX.toFixed(3)}, ${exportLY.toFixed(3)});`)
      lines.push(`    PlayerTextDrawColour(playerid, ${ref}, ${col});`)
      lines.push(`    PlayerTextDrawAlignment(playerid, ${ref}, ${el.align + 1});`)
      if (el.useBox) {
        lines.push(`    PlayerTextDrawUseBox(playerid, ${ref}, 1);`)
        lines.push(`    PlayerTextDrawBoxColour(playerid, ${ref}, ${box});`)
        const { tx, ty } = calcTextSize(el)
        lines.push(`    PlayerTextDrawTextSize(playerid, ${ref}, ${tx.toFixed(1)}, ${ty.toFixed(1)});`)
      }
      if (el.outline > 0)  lines.push(`    PlayerTextDrawSetOutline(playerid, ${ref}, ${el.outline});`)
      if (el.shadow > 0)   lines.push(`    PlayerTextDrawSetShadow(playerid, ${ref}, ${el.shadow});`)
      lines.push(`    PlayerTextDrawBackgroundColor(playerid, ${ref}, ${bg});`)
      if (el.proportional) lines.push(`    PlayerTextDrawSetProportional(playerid, ${ref}, 1);`)
      if (el.selectable)   lines.push(`    PlayerTextDrawSetSelectable(playerid, ${ref}, 1);`)
    }
    lines.push('')
  })

  lines.push('}')
  return lines.join('\n')
}