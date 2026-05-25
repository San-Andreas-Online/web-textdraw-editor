

<script setup>
import { computed } from 'vue'
import { CW, CH } from '../../constants/canvas'

const props = defineProps({
  visible: { type: Boolean, default: true },
  zoom:    { type: Number, default: 1 },
})

const z = computed(() => props.zoom)

const safeStyle = computed(() => ({
  top:    `${34  * z.value}px`,
  left:   `${24  * z.value}px`,
  width:  `${592 * z.value}px`,
  height: `${380 * z.value}px`,
}))
const radarStyle = computed(() => ({
  top:    `${(CH - 97) * z.value}px`,
  left:   '0px',
  width:  `${117 * z.value}px`,
  height: `${97  * z.value}px`,
}))
const chatStyle = computed(() => ({
  top:    '0px',
  left:   '0px',
  width:  `${300 * z.value}px`,
  height: `${100 * z.value}px`,
}))
const weaponStyle = computed(() => ({
  bottom: '0px',
  right:  '0px',
  width:  `${140 * z.value}px`,
  height: `${80  * z.value}px`,
}))
const healthStyle = computed(() => ({
  top:   '0px',
  right: '0px',
  width:  `${200 * z.value}px`,
  height: `${30  * z.value}px`,
}))
</script>

<style scoped>
.safe-zones {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.zone {
  position: absolute;
  box-sizing: border-box;
}
.label {
  font-family: 'Tahoma', sans-serif;
  font-size: 8px;
  padding: 2px;
}
.safe   { border: 1px solid rgba(255,80,80,0.5);   }
.safe   .label { color: rgba(255,80,80,0.8); }
.radar  { border: 1px dashed rgba(250,179,135,0.4); }
.radar  .label { color: rgba(250,179,135,0.6); }
.chat   { border: 1px dashed rgba(137,180,250,0.3); }
.chat   .label { color: rgba(137,180,250,0.5); }
.weapon { border: 1px dashed rgba(166,227,161,0.3); }
.weapon .label { color: rgba(166,227,161,0.5); }
.health { border: 1px dashed rgba(203,166,247,0.3); }
.health .label { color: rgba(203,166,247,0.5); }
</style>
