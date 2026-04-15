<script setup lang="ts">
import {
  Search, RefreshCw, Copy, Check, ChevronDown, ChevronUp,
  FolderOpen, Shield, User, Layers,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useEnvVars } from './useEnvVars'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  loading, currentScope, searchQuery,
  expandedVar, copiedId,
  scopeOptions,
  filteredVars,
  systemCount, userCount, totalCount,
  isPathLike, splitPathValue,
  refresh,
  toggleExpand,
  copyValue, copyName,
} = useEnvVars()
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="环境变量" icon="icon-env">
      <div class="header-content">
        <span class="stat-tag">
          <Shield :size="10" /> {{ systemCount }}
        </span>
        <span class="stat-divider">/</span>
        <span class="stat-tag user">
          <User :size="10" /> {{ userCount }}
        </span>
        <span class="stat-divider">/</span>
        <span class="stat-tag all">{{ totalCount }}</span>
      </div>
    </ToolTitleBar>

    <div class="content">
      <!-- Toolbar card -->
      <div class="toolbar-card">
        <div class="toolbar-row">
          <div class="search-wrap">
            <Search :size="14" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索变量名或值..."
              spellcheck="false"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <span>&times;</span>
            </button>
          </div>

          <div class="scope-group">
            <button v-for="opt in scopeOptions" :key="opt.value"
              :class="['scope-btn', { active: currentScope === opt.value }]"
              @click="currentScope = opt.value">
              <Shield v-if="opt.value === 'system'" :size="12" />
              <User v-else-if="opt.value === 'user'" :size="12" />
              <Layers v-else :size="12" />
              {{ opt.label }}
            </button>
          </div>

          <button class="action-btn" @click="refresh" :disabled="loading"
            @mouseenter="showTooltip('刷新', $event)" @mouseleave="hideTooltip">
            <RefreshCw :size="14" :class="{ spinning: loading }" />
          </button>
        </div>
      </div>

      <!-- Variable list -->
      <div class="list-card">
        <div v-if="loading" class="tool-empty">
          <div class="spinner-lg"></div>
          <p class="empty-title">加载中...</p>
        </div>

        <div v-else-if="filteredVars.length === 0" class="tool-empty">
          <div class="empty-icon"><FolderOpen :size="28" /></div>
          <p class="empty-title">无匹配结果</p>
          <p class="empty-desc">{{ searchQuery ? '尝试其他关键词' : '当前范围无环境变量' }}</p>
        </div>

        <div v-else class="var-list">
          <div
            v-for="v in filteredVars"
            :key="v.name"
            class="var-row"
            :class="{ expanded: expandedVar === v.name }"
          >
            <div class="var-main" @click="toggleExpand(v.name)">
              <div class="var-left">
                <span :class="['var-scope-dot', v.scope]"></span>
                <button class="var-name-btn" @click.stop="copyName(v.name)"
                  @mouseenter="showTooltip('复制名称', $event)" @mouseleave="hideTooltip">
                  <code class="var-name">{{ v.name }}</code>
                  <Check v-if="copiedId === `name-${v.name}`" :size="10" class="copied-icon" />
                </button>
              </div>
              <div class="var-right">
                <span class="var-value-preview">{{ v.value.length > 80 ? v.value.substring(0, 80) + '...' : v.value }}</span>
                <button class="var-copy-btn" @click.stop="copyValue(v.name, v.value)"
                  @mouseenter="showTooltip('复制值', $event)" @mouseleave="hideTooltip">
                  <Check v-if="copiedId === `val-${v.name}`" :size="12" />
                  <Copy v-else :size="12" />
                </button>
                <ChevronDown v-if="expandedVar !== v.name" :size="14" class="expand-icon" />
                <ChevronUp v-else :size="14" class="expand-icon" />
              </div>
            </div>

            <!-- Expanded detail -->
            <div v-if="expandedVar === v.name" class="var-detail">
              <!-- PATH-like: show as list -->
              <template v-if="isPathLike(v.name) && splitPathValue(v.value).length > 1">
                <div class="path-list">
                  <div v-for="(seg, idx) in splitPathValue(v.value)" :key="idx" class="path-item"
                    @click="copyValue(`${v.name}-seg-${idx}`, seg)"
                    @mouseenter="showTooltip('点击复制', $event)" @mouseleave="hideTooltip">
                    <span class="path-index">{{ idx + 1 }}</span>
                    <code class="path-text">{{ seg }}</code>
                  </div>
                </div>
              </template>
              <!-- Regular: show full value -->
              <template v-else>
                <pre class="var-full-value">{{ v.value }}</pre>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== Header ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 4px;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
}

.stat-tag.user { color: var(--accent); background: var(--accent-light); }
.stat-tag.all { color: var(--text-secondary); }

.stat-divider {
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.4;
}

/* ====== Content layout ====== */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
  gap: 10px;
  overflow: hidden;
}

.toolbar-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ====== Search ====== */
.search-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 30px 0 32px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all var(--transition-fast);
}

.search-input:hover { border-color: var(--border-strong); }
.search-input:focus { border-color: var(--accent); box-shadow: var(--shadow-focus); }
.search-input::placeholder { color: var(--text-muted); }

.search-clear {
  position: absolute;
  right: 4px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
  padding: 0;
}

.search-clear:hover { color: var(--text-primary); background: var(--bg-hover); }

/* ====== Scope Buttons ====== */
.scope-group {
  display: flex;
  gap: 2px;
}

.scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.scope-btn:hover {
  border-color: var(--border-default);
  background: var(--bg-hover);
  color: var(--text-primary);
}

.scope-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ====== Action Button ====== */
.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  padding: 0;
  flex-shrink: 0;
}

.action-btn:hover { color: var(--text-primary); background: var(--bg-hover); border-color: var(--border-default); }
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== List Card ====== */
.list-card {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
}

.var-list {
  flex: 1;
  overflow-y: auto;
}

/* ====== Var Row ====== */
.var-row {
  border-bottom: 1px solid var(--border-subtle);
}

.var-row:last-child { border-bottom: none; }

.var-row.expanded {
  background: var(--bg-hover);
}

.var-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  gap: 12px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.var-main:hover { background: var(--bg-hover); }
.var-row.expanded .var-main { background: transparent; }

.var-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.var-scope-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.var-scope-dot.system { background: var(--accent); }
.var-scope-dot.user { background: var(--success); }
.var-scope-dot.other { background: var(--text-muted); opacity: 0.3; }

.var-name-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.var-name {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: transparent;
  padding: 0;
}

.copied-icon {
  color: var(--success);
}

.var-right {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.var-value-preview {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
  text-align: right;
}

.var-copy-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  opacity: 0;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.var-row:hover .var-copy-btn,
.var-row.expanded .var-copy-btn { opacity: 1; }
.var-copy-btn:hover { background: var(--bg-tertiary); color: var(--accent); }

.expand-icon {
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.4;
}

/* ====== Detail Panel ====== */
.var-detail {
  padding: 0 14px 12px 28px;
}

.var-full-value {
  margin: 0;
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* ====== Path List ====== */
.path-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.path-item:hover { background: var(--bg-primary); }

.path-index {
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-radius: 4px;
  flex-shrink: 0;
}

.path-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  word-break: break-all;
  line-height: 1.5;
  background: transparent;
  padding: 0;
}

/* ====== Empty & Loading ====== */
.tool-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  flex: 1;
}

.empty-icon {
  color: var(--text-muted);
  opacity: 0.25;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}

.empty-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
}

.spinner-lg {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-subtle);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== Scrollbar ====== */
.var-list::-webkit-scrollbar { width: 5px; }
.var-list::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.var-list::-webkit-scrollbar-track { background: transparent; }

.var-full-value::-webkit-scrollbar { width: 4px; }
.var-full-value::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 10px; }
.var-full-value::-webkit-scrollbar-track { background: transparent; }

/* ====== Responsive ====== */
@media (max-width: 640px) {
  .toolbar-row { flex-wrap: wrap; }
  .search-wrap { width: 100%; order: 1; }
  .scope-group { order: 2; }
  .action-btn { order: 3; }
}
</style>
