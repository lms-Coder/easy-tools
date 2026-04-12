<script setup lang="ts">
import { ChevronLeft, ChevronRight, CalendarDays, Calendar as CalendarIcon } from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useCalendar } from './useCalendar'

const {
  monthLabel,
  calendarDays,
  weekLabels,
  selectedInfo,
  monthFestivals,
  goToPrevMonth,
  goToNextMonth,
  goToToday,
  selectDate,
} = useCalendar()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="日历" icon="icon-calendar">
      <div class="cal-nav">
        <button class="glass-icon-btn" @click="goToPrevMonth" title="上一月">
          <ChevronLeft :size="14" />
        </button>
        <span class="cal-month-label">{{ monthLabel }}</span>
        <button class="glass-icon-btn" @click="goToNextMonth" title="下一月">
          <ChevronRight :size="14" />
        </button>
        <div class="tool-divider"></div>
        <button class="cal-today-btn" @click="goToToday">今天</button>
      </div>
    </ToolTitleBar>

    <main class="tool-main split">
      <!-- 左侧：月历 -->
      <section class="tool-panel cal-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><CalendarIcon :size="14" /></span>
            <span>月历</span>
          </div>
        </div>
        <div class="tool-panel-body cal-body">
          <!-- 星期标题 -->
          <div class="cal-weekdays">
            <div v-for="(label, i) in weekLabels" :key="i" :class="['cal-wk', { weekend: i >= 5 }]">
              {{ label }}
            </div>
          </div>
          <!-- 日期网格 -->
          <div class="cal-grid">
            <div
              v-for="(day, i) in calendarDays"
              :key="i"
              :class="['cal-cell', {
                'other-month': !day.isCurrentMonth,
                'is-today': day.isToday && !day.isSelected,
                'is-selected': day.isSelected,
                'has-holiday': day.holidayName,
              }]"
              @click="selectDate(day)"
            >
              <span class="cal-num">{{ day.day }}</span>
              <span class="cal-lunar" :title="day.holidayName || day.lunarText">
                {{ day.holidayName || day.lunarText || '·' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：详情 -->
      <section class="tool-panel info-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><CalendarDays :size="14" /></span>
            <span>日期详情</span>
          </div>
        </div>
        <div class="tool-panel-body info-body" v-if="selectedInfo">
          <!-- Hero 区域 -->
          <div class="info-hero">
            <div class="info-hero-date">{{ selectedInfo.solarDate.replace(/^.*年/, '') }}</div>
            <div class="info-hero-full">{{ selectedInfo.solarDate }}</div>
            <div class="info-hero-lunar">{{ selectedInfo.lunarYearFull }}</div>
          </div>

          <!-- 信息卡片网格 -->
          <div class="info-cards">
            <div class="info-card-item">
              <div class="info-card-val">{{ selectedInfo.weekday }}</div>
              <div class="info-card-lbl">星期</div>
            </div>
            <div class="info-card-item">
              <div class="info-card-val">{{ selectedInfo.xingZuo }}</div>
              <div class="info-card-lbl">星座</div>
            </div>
            <div class="info-card-item">
              <div class="info-card-val">{{ selectedInfo.shengXiao }}</div>
              <div class="info-card-lbl">生肖</div>
            </div>
            <div class="info-card-item">
              <div class="info-card-val v-blue">
                <template v-if="selectedInfo.daysFromToday === 0">今天</template>
                <template v-else-if="selectedInfo.daysFromToday > 0">+{{ selectedInfo.daysFromToday }}</template>
                <template v-else>{{ selectedInfo.daysFromToday }}</template>
              </div>
              <div class="info-card-lbl">距今天</div>
            </div>
          </div>

          <!-- 假期 -->
          <div v-if="selectedInfo.holidayName" class="info-holiday">
            <div class="info-holiday-name">{{ selectedInfo.holidayName }}</div>
          </div>

          <!-- 选中日期的节日 -->
          <div v-if="selectedInfo.festivals.length" class="info-selected-fest">
            <span v-for="(f, i) in selectedInfo.festivals" :key="i" class="info-fest-tag">{{ f }}</span>
          </div>

          <!-- 当月节日节气列表 -->
          <div v-if="monthFestivals.length" class="info-month-fest">
            <div class="info-month-title">本月节日 · 节气</div>
            <div class="info-month-list">
              <div v-for="(item, i) in monthFestivals" :key="i" class="info-month-item">
                <span class="info-month-day">{{ item.day }}日</span>
                <span class="info-month-names">
                  <span v-for="(f, fi) in item.festivals" :key="fi" class="tag-festival">{{ f }}</span>
                  <span v-if="item.jieQi" class="tag-jieqi">{{ item.jieQi }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* ====== 导航 ====== */
.cal-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cal-month-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 90px;
  text-align: center;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

.cal-today-btn {
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.cal-today-btn:hover {
  background: var(--accent);
  color: #fff;
}

/* ====== 月历面板 ====== */
.cal-panel {
  min-width: 0;
}

.cal-body {
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px !important;
  overflow: auto;
}

/* 星期标题 */
.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.cal-wk {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 8px 0;
  user-select: none;
}

.cal-wk.weekend {
  color: var(--error);
}

/* 日期网格 - 固定高度关键样式 */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 72px);
  gap: 2px;
}

.cal-cell {
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 2px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.12s ease;
  overflow: hidden;
}

.cal-cell:hover {
  background: var(--bg-hover);
}

.cal-num {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.cal-lunar {
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.2;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  padding: 0 4px;
}

/* 其他月份的日期 */
.cal-cell.other-month {
  opacity: 0.35;
}

.cal-cell.other-month:hover {
  opacity: 0.6;
}

/* 今天 */
.cal-cell.is-today .cal-num {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 700;
}

/* 选中状态 */
.cal-cell.is-selected {
  background: var(--accent-light);
}

.cal-cell.is-selected .cal-num {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}

.cal-cell.is-selected .cal-lunar {
  color: var(--accent);
  font-weight: 500;
}

/* 有节假日的日期 */
.cal-cell.has-holiday:not(.is-selected) .cal-lunar {
  color: var(--error);
  font-weight: 600;
}

/* ====== 右侧详情面板（恢复原版风格） ====== */
.info-panel {
  min-width: 280px;
}

.info-body {
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  overflow: hidden;
}

/* Hero 区域 */
.info-hero {
  text-align: center;
  padding: 28px 20px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: linear-gradient(180deg, var(--accent-light) 0%, transparent 100%);
}

.info-hero-date {
  font-size: 44px;
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}

.info-hero-full {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 4px;
}

.info-hero-lunar {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 信息卡片网格 */
.info-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 14px;
}

.info-card-item {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  text-align: center;
}

.info-card-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.info-card-lbl {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 3px;
}

.v-blue {
  color: var(--accent);
  font-weight: 700;
}

/* 假期标签 */
.info-holiday {
  padding: 0 14px 8px;
}

.info-holiday-name {
  display: inline-flex;
  padding: 5px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--error);
  background: var(--error-light);
  border-radius: var(--radius-sm);
}

/* 选中日期的节日标签 */
.info-selected-fest {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 14px 10px;
}

.info-fest-tag {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  border-radius: var(--radius-xs);
}

/* 当月节日节气列表 */
.info-month-fest {
  margin-top: auto;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.info-month-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 10px 14px 6px;
  flex-shrink: 0;
}

.info-month-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0 14px 14px;
  min-height: 0;
}

.info-month-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.info-month-day {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  width: 28px;
  flex-shrink: 0;
  text-align: right;
}

.info-month-names {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-festival {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--error);
  background: var(--error-light);
  border-radius: var(--radius-xs);
}

.tag-jieqi {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--warning);
  background: var(--warning-light);
  border-radius: var(--radius-xs);
}

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .tool-main {
    grid-template-columns: 1fr !important;
  }
  
  .info-panel {
    min-width: auto;
  }
  
  .cal-grid {
    grid-template-rows: repeat(6, 64px);
  }
  
  .cal-cell {
    height: 64px;
  }
}

@media (max-width: 480px) {
  .cal-grid {
    grid-template-rows: repeat(6, 56px);
    gap: 1px;
  }
  
  .cal-cell {
    height: 56px;
  }
  
  .cal-num {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
  
  .cal-lunar {
    font-size: 9px;
  }
  
  .cal-body {
    padding: 8px !important;
  }
  
  .info-hero-date {
    font-size: 36px;
  }
}
</style>
