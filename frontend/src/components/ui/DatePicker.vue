<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import dayjs, { type Dayjs } from 'dayjs'

const props = withDefaults(defineProps<{
  modelValue: Dayjs | null
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: '选择日期',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: Dayjs | null]
}>()

const open = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// 视图模式: 'day' | 'month' | 'year'
type ViewMode = 'day' | 'month' | 'year'
const viewMode = ref<ViewMode>('day')

const viewYear = ref(dayjs().year())
const viewMonth = ref(dayjs().month())

const weekHeaders = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const firstDay = dayjs(new Date(viewYear.value, viewMonth.value, 1))
  const startDow = firstDay.day()
  const startDate = firstDay.subtract(startDow, 'day')
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = startDate.add(i, 'day')
    days.push({
      date: d,
      day: d.date(),
      isCurrentMonth: d.month() === viewMonth.value && d.year() === viewYear.value,
      isToday: d.isSame(dayjs(), 'day'),
      isSelected: props.modelValue ? d.isSame(props.modelValue, 'day') : false,
    })
  }
  return days
})

const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const yearRangeStart = computed(() => Math.floor(viewYear.value / 10) * 10 - 1)
const yearRange = computed(() => {
  const start = yearRangeStart.value
  const years = []
  for (let i = 0; i < 12; i++) {
    years.push(start + i)
  }
  return years
})

const viewLabel = computed(() => {
  if (viewMode.value === 'day') return `${viewYear.value}年${viewMonth.value + 1}月`
  if (viewMode.value === 'month') return `${viewYear.value}年`
  return `${yearRangeStart.value + 1} - ${yearRangeStart.value + 10}`
})

const displayText = computed(() => props.modelValue ? props.modelValue.format('YYYY-MM-DD') : '')

const panelStyle = computed(() => {
  if (!open.value || !wrapperRef.value) return {}
  const rect = wrapperRef.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom > 340
  return {
    position: 'fixed' as const,
    zIndex: 10000,
    top: below ? `${rect.bottom + 4}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - rect.top + 4}px`,
    left: `${rect.left}px`,
  }
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  viewMode.value = 'day'
  if (open.value) {
    if (props.modelValue) {
      viewYear.value = props.modelValue.year()
      viewMonth.value = props.modelValue.month()
    } else {
      const today = dayjs()
      viewYear.value = today.year()
      viewMonth.value = today.month()
    }
  }
}

function prevMonth() {
  if (viewMode.value === 'day') {
    if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
    else viewMonth.value--
  } else if (viewMode.value === 'month') {
    viewYear.value--
  } else {
    viewYear.value -= 10
  }
}

function nextMonth() {
  if (viewMode.value === 'day') {
    if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
    else viewMonth.value++
  } else if (viewMode.value === 'month') {
    viewYear.value++
  } else {
    viewYear.value += 10
  }
}

function switchToMonthMode() {
  viewMode.value = 'month'
}

function switchToYearMode() {
  viewMode.value = 'year'
}

function selectMonth(m: number) {
  viewMonth.value = m
  viewMode.value = 'day'
}

function selectYear(y: number) {
  viewYear.value = y
  viewMode.value = 'month'
}

function selectDay(day: { date: Dayjs; isCurrentMonth: boolean }) {
  emit('update:modelValue', day.date)
  open.value = false
  if (!day.isCurrentMonth) {
    viewYear.value = day.date.year()
    viewMonth.value = day.date.month()
  }
}

function goToday() {
  const today = dayjs()
  viewYear.value = today.year()
  viewMonth.value = today.month()
  viewMode.value = 'day'
  emit('update:modelValue', today)
  open.value = false
}

function onMousedownOutside(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (!wrapperRef.value?.contains(target) && !panelRef.value?.contains(target)) {
    open.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
}

onMounted(() => {
  document.addEventListener('mousedown', onMousedownOutside)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onMousedownOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="wrapperRef"
    :class="['ui-datepicker', { 'ui-datepicker-open': open, 'ui-datepicker-disabled': disabled }]"
  >
    <button class="ui-datepicker-trigger" @click="toggle" :disabled="disabled">
      <span :class="['ui-datepicker-value', { 'ui-datepicker-placeholder': !displayText }]">
        {{ displayText || placeholder }}
      </span>
      <ChevronRight class="ui-datepicker-arrow" :size="14" />
    </button>
  </div>
  <Teleport to="body">
    <Transition name="datepicker-panel">
      <div v-if="open" ref="panelRef" class="ui-datepicker-panel" :style="panelStyle">
        <!-- 导航头 -->
        <div class="ui-datepicker-nav">
          <button class="ui-datepicker-nav-btn" @click="prevMonth"><ChevronLeft :size="14" /></button>
          <div class="ui-datepicker-nav-labels">
            <template v-if="viewMode === 'day'">
              <button class="ui-datepicker-label-btn" @click="switchToYearMode">{{ viewYear }}年</button>
              <button class="ui-datepicker-label-btn" @click="switchToMonthMode">{{ viewMonth + 1 }}月</button>
            </template>
            <template v-else-if="viewMode === 'month'">
              <button class="ui-datepicker-label-btn" @click="switchToYearMode">{{ viewYear }}年</button>
            </template>
            <template v-else>
              <button class="ui-datepicker-label-btn">{{ viewLabel }}</button>
            </template>
          </div>
          <button class="ui-datepicker-nav-btn" @click="nextMonth"><ChevronRight :size="14" /></button>
        </div>

        <!-- 日历视图 -->
        <template v-if="viewMode === 'day'">
          <div class="ui-datepicker-weekdays">
            <span v-for="w in weekHeaders" :key="w" class="ui-datepicker-weekday">{{ w }}</span>
          </div>
          <div class="ui-datepicker-grid">
            <button
              v-for="(day, i) in calendarDays"
              :key="i"
              :class="[
                'ui-datepicker-day',
                { 'ui-datepicker-day-other': !day.isCurrentMonth },
                { 'ui-datepicker-day-today': day.isToday },
                { 'ui-datepicker-day-selected': day.isSelected },
              ]"
              @click="selectDay(day)"
            >{{ day.day }}</button>
          </div>
        </template>

        <!-- 月份选择视图 -->
        <template v-if="viewMode === 'month'">
          <div class="ui-datepicker-monthgrid">
            <button
              v-for="(name, idx) in monthNames"
              :key="idx"
              :class="[
                'ui-datepicker-monthcell',
                { 'ui-datepicker-monthcell-current': idx === dayjs().month() && viewYear === dayjs().year() },
                { 'ui-datepicker-monthcell-selected': idx === viewMonth },
              ]"
              @click="selectMonth(idx)"
            >{{ name }}</button>
          </div>
        </template>

        <!-- 年份选择视图 -->
        <template v-if="viewMode === 'year'">
          <div class="ui-datepicker-yeargrid">
            <button
              v-for="y in yearRange"
              :key="y"
              :class="[
                'ui-datepicker-yearcell',
                { 'ui-datepicker-yearcell-other': y === yearRangeStart || y === yearRangeStart + 11 },
                { 'ui-datepicker-yearcell-current': y === dayjs().year() },
                { 'ui-datepicker-yearcell-selected': y === viewYear },
              ]"
              @click="selectYear(y)"
            >{{ y }}</button>
          </div>
        </template>

        <!-- 底部：今天按钮 -->
        <div class="ui-datepicker-footer">
          <button class="ui-datepicker-today-btn" @click="goToday">今天</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.datepicker-panel-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.datepicker-panel-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.datepicker-panel-enter-from,
.datepicker-panel-leave-to {
  opacity: 0;
  transform: scaleY(0.92);
}

.ui-datepicker-panel {
  transform-origin: top center;
  width: 272px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius-lg);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  padding: 12px;
  user-select: none;
}

:root.dark .ui-datepicker-panel {
  background: rgba(30, 30, 40, 0.78);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.36),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ui-datepicker-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.ui-datepicker-nav-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ui-datepicker-nav-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.ui-datepicker-nav-labels {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ui-datepicker-label-btn {
  border: none;
  background: transparent;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.ui-datepicker-label-btn:hover {
  background: var(--bg-hover);
  color: var(--accent);
}

.ui-datepicker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.ui-datepicker-weekday {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  padding: 4px 0;
}

.ui-datepicker-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.ui-datepicker-day {
  width: 34px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  background: transparent;
  margin: 0 auto;
}

.ui-datepicker-day:hover {
  background: var(--bg-hover);
}

.ui-datepicker-day-other {
  color: var(--text-disabled);
}

.ui-datepicker-day-today {
  font-weight: 700;
  color: var(--accent);
}

.ui-datepicker-day-selected {
  background: var(--accent) !important;
  color: var(--text-inverse, #fff) !important;
  font-weight: 600;
}

/* 月份网格 */
.ui-datepicker-monthgrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px 0;
}

.ui-datepicker-monthcell {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  background: transparent;
}

.ui-datepicker-monthcell:hover {
  background: var(--bg-hover);
}

.ui-datepicker-monthcell-current {
  color: var(--accent);
  font-weight: 600;
}

.ui-datepicker-monthcell-selected {
  background: var(--accent) !important;
  color: var(--text-inverse, #fff) !important;
  font-weight: 600;
}

/* 年份网格 */
.ui-datepicker-yeargrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px 0;
}

.ui-datepicker-yearcell {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  background: transparent;
}

.ui-datepicker-yearcell:hover {
  background: var(--bg-hover);
}

.ui-datepicker-yearcell-other {
  color: var(--text-disabled);
}

.ui-datepicker-yearcell-current {
  color: var(--accent);
  font-weight: 600;
}

.ui-datepicker-yearcell-selected {
  background: var(--accent) !important;
  color: var(--text-inverse, #fff) !important;
  font-weight: 600;
}

/* 底部 */
.ui-datepicker-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
}

.ui-datepicker-today-btn {
  border: none;
  background: transparent;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  padding: 3px 10px;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
}

.ui-datepicker-today-btn:hover {
  background: var(--accent-light);
}
</style>

<style scoped>
.ui-datepicker {
  display: block;
}

.ui-datepicker-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.ui-datepicker-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.ui-datepicker-trigger:hover {
  border-color: var(--border-strong);
  background: var(--bg-hover);
}

.ui-datepicker-open .ui-datepicker-trigger,
.ui-datepicker-trigger:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.ui-datepicker-value {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ui-datepicker-placeholder {
  color: var(--text-muted);
}

.ui-datepicker-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.ui-datepicker-open .ui-datepicker-arrow {
  transform: rotate(90deg);
}
</style>
