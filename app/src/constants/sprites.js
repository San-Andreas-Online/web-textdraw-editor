const def = (lib, textures) => textures.map(tex => ({ lib, tex }))

export const KNOWN_SPRITES = [
  ...def('fonts', [
    'font1',
    'font2'
  ]),

  ...def('hud', [
    'arrow',
    'fist',
    'radardisc',
    'radarRingPlane',
    'radar_airYard',
    'radar_ammugun',
    'radar_barbers',
    'radar_BIGSMOKE',
    'radar_boatyard',
    'radar_bulldozer',
    'radar_burgerShot',
    'radar_cash',
    'radar_CATALINAPINK',
    'radar_centre',
    'radar_CESARVIAPANDO',
    'radar_chicken',
    'radar_CJ',
    'radar_CRASH1',
    'radar_dateDisco',
    'radar_dateDrink',
    'radar_dateFood',
    'radar_diner',
    'radar_emmetGun',
    'radar_enemyAttack',
    'radar_fire',
    'radar_Flag',
    'radar_gangB',
    'radar_gangG',
    'radar_gangN',
    'radar_gangP',
    'radar_gangY',
    'radar_girlfriend',
    'radar_gym',
    'radar_hostpital',
    'radar_impound',
    'radar_light',
    'radar_LocoSyndicate',
    'radar_MADDOG',
    'radar_mafiaCasino',
    'radar_MCSTRAP',
    'radar_modGarage',
    'radar_north',
    'radar_OGLOC',
    'radar_pizza',
    'radar_police',
    'radar_propertyG',
    'radar_propertyR',
    'radar_qmark',
    'radar_race',
    'radar_runway',
    'radar_RYDER',
    'radar_saveGame',
    'radar_school',
    'radar_spray',
    'radar_SWEET',
    'radar_tattoo',
    'radar_THETRUTH',
    'radar_TORENO',
    'radar_TorenoRanch',
    'radar_triads',
    'radar_triadsCasino',
    'radar_truck',
    'radar_tshirt',
    'radar_waypoint',
    'radar_WOOZIE',
    'radar_ZERO',
    'siteM16',
    'siterocket',
    'skipicon'
  ]),

  ...def('intro1', ['intro1']),
  ...def('intro2', ['intro2']),
  ...def('intro3', ['intro3']),
  ...def('intro4', ['intro4']),

  ...def ('LD_SPAC', ['white']),
  
  ...def('LD_BEAT', [
    'chit',
    'circle',
    'cring',
    'cross',
    'down',
    'downl',
    'downr',
    'left',
    'right',
    'square',
    'triang',
    'up',
    'upl',
    'upr'
  ]),

  ...def('LD_BUM', [
    'bum1',
    'bum2'
  ]),

  ...def('LD_CARD', [
    'cd10c',
    'cd10d',
    'cd10h',
    'cd10s',
    'cd11c',
    'cd11d',
    'cd11h',
    'cd11s',
    'cd12c',
    'cd12d',
    'cd12h',
    'cd12s',
    'cd13c',
    'cd13d',
    'cd13h',
    'cd13s',
    'cd1c',
    'cd1d',
    'cd1h',
    'cd1s',
    'cd2c',
    'cd2d',
    'cd2h',
    'cd2s',
    'cd3c',
    'cd3d',
    'cd3h',
    'cd3s',
    'cd4c',
    'cd4d',
    'cd4h',
    'cd4s',
    'cd5c',
    'cd5d',
    'cd5h',
    'cd5s',
    'cd6c',
    'cd6d',
    'cd6h',
    'cd6s',
    'cd7c',
    'cd7d',
    'cd7h',
    'cd7s',
    'cd8c',
    'cd8d',
    'cd8h',
    'cd8s',
    'cd9c',
    'cd9d',
    'cd9h',
    'cd9s',
    'cdback'
  ]),

  ...def('LD_CHAT', [
    'badchat',
    'dpad_64',
    'dpad_lr',
    'goodcha',
    'thumbdn',
    'thumbup'
  ]),

  ...def('LD_DRV', [
    'brboat',
    'brfly',
    'bronze',
    'goboat',
    'gold',
    'golfly',
    'naward',
    'nawtxt',
    'ribb',
    'ribbw',
    'silboat',
    'silfly',
    'silver',
    'tvbase',
    'tvcorn'
  ]),

  ...def('LD_DUAL', [
    'backgnd',
    'dark',
    'DUALITY',
    'ex1',
    'ex2',
    'ex3',
    'ex4',
    'Health',
    'layer',
    'light',
    'power',
    'rockshp',
    'shoot',
    'thrustG'
  ]),

  ...def('LD_GRAV', [
    'bee1',
    'bee2',
    'beea',
    'bumble',
    'exitw',
    'exity',
    'flwr',
    'flwra',
    'ghost',
    'hiscorew',
    'hiscorey',
    'hive',
    'hon',
    'leaf',
    'playw',
    'playy',
    'sky',
    'thorn',
    'timer',
    'tvl',
    'tvr'
  ]),

  ...def('LD_NONE', [
    'explm01',
    'explm02',
    'explm03',
    'explm04',
    'explm05',
    'explm06',
    'explm07',
    'explm08',
    'explm09',
    'explm10',
    'explm11',
    'explm12',
    'force',
    'light',
    'ship',
    'ship2',
    'ship3',
    'shoot',
    'shpnorm',
    'shpwarp',
    'thrust',
    'title',
    'warp'
  ]),

  ...def('LD_OTB', [
    'bckgrnd',
    'bride1',
    'bride2',
    'bride3',
    'bride4',
    'bride5',
    'bride6',
    'bride7',
    'bride8',
    'bushes',
    'fen',
    'gride1',
    'gride2',
    'gride3',
    'gride4',
    'gride5',
    'gride6',
    'gride7',
    'gride8',
    'hrs1',
    'hrs2',
    'hrs3',
    'hrs4',
    'hrs5',
    'hrs6',
    'hrs7',
    'hrs8',
    'pole2',
    'pride1',
    'pride2',
    'pride3',
    'pride4',
    'pride5',
    'pride6',
    'pride7',
    'pride8',
    'rride1',
    'rride2',
    'rride3',
    'rride4',
    'rride5',
    'rride6',
    'rride7',
    'rride8',
    'trees',
    'yride1',
    'yride2',
    'yride3',
    'yride4',
    'yride5',
    'yride6',
    'yride7',
    'yride8'
  ]),

  ...def('LD_OTB2', [
    'backbet',
    'butnA',
    'butnAo',
    'butnB',
    'butnBo',
    'butnC',
    'Ric1',
    'Ric2',
    'Ric3',
    'Ric4',
    'Ric5'
  ]),

  ...def('LD_PLAN', [
    'AirLogo'
  ]),

  ...def('LD_POKE', [
    'addcoin',
    'backcyan',
    'backred',
    'deal',
    'holdmid',
    'holdoff',
    'holdon'
  ]),

  ...def('LD_POOL', [
    'ball',
    'nib'
  ]),

  ...def('LD_RACE', [
    'race00',
    'race01',
    'race02',
    'race03',
    'race04',
    'race05',
    'race06',
    'race07',
    'race08',
    'race09',
    'race10',
    'race11',
    'race12'
  ]),

  ...def('LD_RCE1', [
    'race00',
    'race01',
    'race02',
    'race03',
    'race04',
    'race05'
  ]),

  ...def('LD_RCE2', [
    'race06',
    'race07',
    'race08',
    'race09',
    'race10',
    'race11'
  ]),

  ...def('LD_RCE3', [
    'race12',
    'race13',
    'race14',
    'race15',
    'race16',
    'race17'
  ]),

  ...def('LD_RCE4', [
    'race18',
    'race19',
    'race20',
    'race21',
    'race22',
    'race23'
  ]),

  ...def('LD_RCE5', [
    'race24'
  ]),

  ...def('LD_ROUL', [
    'roulbla',
    'roulgre',
    'roulred'
  ]),

  ...def('LD_SHTR', [
    'bstars',
    'cbarl',
    'cbarm',
    'cbarr',
    'ex1',
    'ex2',
    'ex3',
    'ex4',
    'fire',
    'fstar',
    'hbarl',
    'hbarm',
    'hbarr',
    'hi_a',
    'hi_b',
    'hi_c',
    'kami',
    'nmef',
    'pa',
    'pm2',
    'pm3',
    'ps1',
    'ps2',
    'ps3',
    'ship',
    'splsh',
    'ufo',
    'un_a',
    'un_b',
    'un_c'
  ]),

  ...def('LD_SLOT', [
    'bar1_o',
    'bar2_o',
    'bell',
    'cherry',
    'grapes',
    'r_69'
  ]),

  ...def('LD_TATT', [
    '10ls',
    '10ls2',
    '10ls3',
    '10ls4',
    '10ls5',
    '10og',
    '10weed',
    '11dice',
    '11dice2',
    '11ggift',
    '11grov2',
    '11grov3',
    '11grove',
    '11jail',
    '12angel',
    '12bndit',
    '12cross',
    '12dager',
    '12maybr',
    '12myfac',
    '4rip',
    '4spider',
    '4weed',
    '5cross',
    '5cross2',
    '5cross3',
    '5gun',
    '6africa',
    '6aztec',
    '6clown',
    '6crown',
    '7cross',
    '7cross2',
    '7cross3',
    '7mary',
    '8gun',
    '8poker',
    '8sa',
    '8sa2',
    '8sa3',
    '8santos',
    '8westsd',
    '9bullt',
    '9crown',
    '9gun',
    '9gun2',
    '9homby',
    '9rasta'
  ]),

  ...def('LOADSCS', [
    'eax',
    'loadsc0',
    'loadsc1',
    'loadsc10',
    'loadsc11',
    'loadsc12',
    'loadsc13',
    'loadsc14',
    'loadsc2',
    'loadsc3',
    'loadsc4',
    'loadsc5',
    'loadsc6',
    'loadsc7',
    'loadsc8',
    'loadsc9',
    'nvidia',
    'title_pc_EU',
    'title_pc_US'
  ]),

  ...def('outro', [
    'outro'
  ]),

  ...def('samaps', [
    'gtasamapbit1',
    'gtasamapbit2',
    'gtasamapbit3',
    'gtasamapbit4',
    'map'
  ]),

  ...def('splash1', [
    'splash1'
  ]),

  ...def('splash2', [
    'splash2'
  ])
]

export function spriteImagePath(lib, tex) {
  const libL = lib.toLowerCase()
  const texL = tex.toLowerCase()
  const known = KNOWN_SPRITES.find(s => s.lib.toLowerCase() === libL && s.tex.toLowerCase() === texL)
  if (known) {
    return `https://assets.open.mp/assets/images/sprites/${known.lib}/${known.tex}.png`
  }
  return `https://files.prineside.com/gtasa_samp_game_texture//png/${lib}.${tex}.png`
}

export function localSpriteImagePath(lib, tex) {
  const libL = lib.toLowerCase()
  const texL = tex.toLowerCase()
  const known = KNOWN_SPRITES.find(s => s.lib.toLowerCase() === libL && s.tex.toLowerCase() === texL)
  if (known) {
    return `sprites/${known.lib}/${known.tex}.png`
  }
  return `sprites/${lib}/${tex}.png`
}