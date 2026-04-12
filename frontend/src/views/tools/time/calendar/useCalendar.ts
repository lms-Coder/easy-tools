import { ref, computed } from 'vue'
import dayjs from 'dayjs'
// @ts-ignore — no type definitions
import { Solar, Lunar, HolidayUtil } from 'lunar-javascript'

interface CalendarDay {
  date: dayjs.Dayjs
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  lunarText: string
  isHoliday: boolean
  holidayName: string
  isWeekend: boolean
}

interface SelectedInfo {
  solarDate: string
  lunarDate: string
  lunarYearFull: string
  ganZhiYear: string
  weekday: string
  festivals: string[]
  holidayName: string
  daysFromToday: number
  isLeapMonth: boolean
  lunarMonthDay: string
  shengXiao: string
  xingZuo: string
}

const today = dayjs()

const currentYear = ref(today.year())
const currentMonth = ref(today.month() + 1) // 1-12
const selectedDate = ref<dayjs.Dayjs>(today)

const monthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const getLunarDayText = (year: number, month: number, day: number): { text: string; isFestival: boolean; festivalName: string } => {
  try {
    const solar = Solar.fromYmd(year, month, day)
    const lunar = solar.getLunar()

    // 农历节日优先
    const lunarFestivals = lunar.getFestivals()
    if (lunarFestivals.length > 0) {
      return { text: lunarFestivals[0], isFestival: true, festivalName: lunarFestivals[0] }
    }
    const lunarOtherFestivals = lunar.getOtherFestivals()
    if (lunarOtherFestivals.length > 0) {
      return { text: lunarOtherFestivals[0], isFestival: true, festivalName: lunarOtherFestivals[0] }
    }

    // 节气
    const jieQi = lunar.getJieQi()
    if (jieQi) {
      return { text: jieQi, isFestival: true, festivalName: jieQi }
    }

    // 公历节日
    const solarFestivals = solar.getFestivals()
    if (solarFestivals.length > 0) {
      return { text: solarFestivals[0], isFestival: true, festivalName: solarFestivals[0] }
    }
    const solarOtherFestivals = solar.getOtherFestivals()
    if (solarOtherFestivals.length > 0) {
      return { text: solarOtherFestivals[0], isFestival: true, festivalName: solarOtherFestivals[0] }
    }

    // 初一显示月名
    if (lunar.getDay() === 1) {
      return { text: lunar.getMonthInChinese() + '月', isFestival: false, festivalName: '' }
    }

    return { text: lunar.getDayInChinese(), isFestival: false, festivalName: '' }
  } catch {
    return { text: '', isFestival: false, festivalName: '' }
  }
}

const getHolidayName = (year: number, month: number, day: number): string => {
  try {
    const holiday = HolidayUtil.getHoliday(year, month, day)
    if (holiday && !holiday.isWork()) {
      return holiday.getName()
    }
  } catch {
    // ignore
  }
  return ''
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value

  // 本月第一天
  const firstOfMonth = dayjs(new Date(year, month - 1, 1))
  // 本月第一天是周几 (0=周日, 1=周一, ... 6=周六) → 转为周一起始
  const rawDow = firstOfMonth.day() // 0=Sun
  const startDow = rawDow === 0 ? 6 : rawDow - 1 // 0=Mon, 6=Sun

  // 日历起始日（上月末尾补齐）
  const startDate = firstOfMonth.subtract(startDow, 'day')

  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const d = startDate.add(i, 'day')
    const lunarInfo = getLunarDayText(d.year(), d.month() + 1, d.date())
    const holidayName = getHolidayName(d.year(), d.month() + 1, d.date())

    days.push({
      date: d,
      day: d.date(),
      isCurrentMonth: d.month() + 1 === month && d.year() === year,
      isToday: d.isSame(today, 'day'),
      isSelected: d.isSame(selectedDate.value, 'day'),
      lunarText: lunarInfo.text,
      isHoliday: lunarInfo.isFestival || holidayName !== '',
      holidayName: holidayName || lunarInfo.festivalName,
      isWeekend: d.day() === 0 || d.day() === 6,
    })
  }

  return days
})

const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

// 当月节日节气列表（按日期分组，每天一行）
interface MonthFestivalItem {
  day: number
  festivals: string[]
  jieQi: string
}

const monthFestivals = computed<MonthFestivalItem[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const daysInMonth = dayjs(new Date(year, month, 0)).date()
  const result: MonthFestivalItem[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    try {
      const solar = Solar.fromYmd(year, month, d)
      const lunar = solar.getLunar()

      const festivals: string[] = []
      const seen = new Set<string>()

      // 农历节日
      lunar.getFestivals().forEach((f: string) => { if (!seen.has(f)) { festivals.push(f); seen.add(f) } })
      lunar.getOtherFestivals().forEach((f: string) => { if (!seen.has(f)) { festivals.push(f); seen.add(f) } })
      // 公历节日
      solar.getFestivals().forEach((f: string) => { if (!seen.has(f)) { festivals.push(f); seen.add(f) } })
      solar.getOtherFestivals().forEach((f: string) => { if (!seen.has(f)) { festivals.push(f); seen.add(f) } })

      const jieQi = lunar.getJieQi() || ''

      if (festivals.length > 0 || jieQi) {
        result.push({ day: d, festivals, jieQi })
      }
    } catch {
      // ignore
    }
  }

  return result
})

const selectedInfo = computed<SelectedInfo | null>(() => {
  if (!selectedDate.value) return null

  const d = selectedDate.value
  try {
    const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date())
    const lunar = solar.getLunar()

    const festivals: string[] = []
    lunar.getFestivals().forEach((f: string) => festivals.push(f))
    lunar.getOtherFestivals().forEach((f: string) => festivals.push(f))
    solar.getFestivals().forEach((f: string) => festivals.push(f))
    solar.getOtherFestivals().forEach((f: string) => festivals.push(f))
    const jieQi = lunar.getJieQi()
    if (jieQi) festivals.push(jieQi)

    const holidayName = getHolidayName(d.year(), d.month() + 1, d.date())

    return {
      solarDate: d.format('YYYY年M月D日'),
      lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      lunarYearFull: lunar.getYearInGanZhi() + '年 ' + lunar.getMonthInChinese() + '月' + lunar.getDayInChinese(),
      ganZhiYear: lunar.getYearInGanZhi() + '年',
      weekday: ['日', '一', '二', '三', '四', '五', '六'][d.day()],
      festivals,
      holidayName,
      daysFromToday: d.diff(today, 'day'),
      isLeapMonth: lunar.getMonth() < 0,
      lunarMonthDay: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      shengXiao: lunar.getYearShengXiao(),
      xingZuo: solar.getXingZuo() + '座',
    }
  } catch {
    return null
  }
})

const goToPrevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const goToNextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToToday = () => {
  currentYear.value = today.year()
  currentMonth.value = today.month() + 1
  selectedDate.value = today
}

const selectDate = (day: CalendarDay) => {
  selectedDate.value = day.date
  if (!day.isCurrentMonth) {
    currentYear.value = day.date.year()
    currentMonth.value = day.date.month() + 1
  }
}

export function useCalendar() {
  return {
    currentYear,
    currentMonth,
    selectedDate,
    monthLabel,
    calendarDays,
    weekLabels,
    selectedInfo,
    monthFestivals,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    selectDate,
  }
}
