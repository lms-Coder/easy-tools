<script setup lang="ts">
import {
  Search, Star, Copy, Check, BookOpen, Terminal, X,
  Upload, Trash2, Info, FileJson, Heart,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import { useLinuxCommands } from './useLinuxCommands'
import { useTooltip } from '@/composables/useTooltip'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  categories,
  selectedCategory,
  selectedCommand,
  searchText,
  copiedId,
  favorites,
  showFavoritesOnly,
  filteredCommands,
  getCategoryCount,
  selectCommand,
  toggleFavorite,
  copyToClipboard,
  customCommands,
  configPath,
  showImportPanel,
  importText,
  importLoading,
  deleteCustomCommand,
  importCommands,
  toggleImportPanel,
  isCustomCommand,
  openConfigFile,
} = useLinuxCommands()

const importCategories = categories.filter(c => c.id !== 'all' && c.id !== 'custom')

const importExample = JSON.stringify([
  {
    name: 'mycommand',
    shortDesc: '我的自定义命令',
    category: 'file',
    syntax: 'mycommand [选项] 文件',
    description: '这是一个自定义命令的示例描述。',
    options: [{ flag: '-v', desc: '显示详细信息' }],
    examples: [{ cmd: 'mycommand -v file.txt', desc: '详细模式运行' }],
    tags: ['custom', 'example'],
  },
], null, 2)
</script>

<template>
  <div class="tool-page">
    <ToolTitleBar title="Linux 命令速查" icon="icon-linux">
      <div class="header-content">
        <span class="stat-tag">{{ filteredCommands.length }} 个命令</span>
        <span v-if="customCommands.length" class="stat-tag custom-tag">{{ customCommands.length }} 自定义</span>
      </div>
    </ToolTitleBar>

    <main class="tool-main split">
      <!-- 左侧：工具栏 + 分类 + 搜索 + 命令列表 -->
      <section class="tool-panel">
        <div class="tool-panel-header">
          <div class="tool-panel-title">
            <span class="panel-icon blue"><Terminal :size="14" /></span>
            <span>命令列表</span>
          </div>
          <div class="panel-actions">
            <button
              class="action-btn"
              :class="{ active: showFavoritesOnly }"
              @click="showFavoritesOnly = !showFavoritesOnly"
              @mouseenter="showTooltip('只显示收藏', $event)"
              @mouseleave="hideTooltip"
            >
              <Heart :size="13" :fill="showFavoritesOnly ? 'currentColor' : 'none'" />
            </button>
            <button
              class="action-btn"
              @click="toggleImportPanel"
              @mouseenter="showTooltip('导入自定义命令', $event)"
              @mouseleave="hideTooltip"
            >
              <Upload :size="13" />
            </button>
          </div>
        </div>

        <div class="tool-panel-body">
          <div class="category-segment">
            <button
              v-for="cat in categories"
              :key="cat.id"
              :class="['category-btn', { active: selectedCategory === cat.id }]"
              @click="selectedCategory = cat.id"
            >
              {{ cat.name }}
              <span class="cat-count">({{ getCategoryCount(cat.id) }})</span>
            </button>
          </div>

          <div class="search-box">
            <Search :size="14" class="search-icon" />
            <input
              v-model="searchText"
              type="text"
              class="search-input"
              placeholder="搜索命令、描述或标签..."
              spellcheck="false"
            />
            <button v-if="searchText" class="search-clear" @click="searchText = ''">
              <X :size="12" />
            </button>
          </div>

          <div class="command-list">
            <div
              v-for="cmd in filteredCommands"
              :key="cmd.name"
              :class="['command-item', { selected: selectedCommand?.name === cmd.name }]"
              @click="selectCommand(cmd)"
            >
              <div class="cmd-header">
                <div class="cmd-name-wrap">
                  <span class="cmd-name">{{ cmd.name }}</span>
                  <span v-if="isCustomCommand(cmd.name)" class="custom-badge">自定义</span>
                </div>
                <button
                  class="fav-btn"
                  :class="{ active: favorites.has(cmd.name) }"
                  @click.stop="toggleFavorite(cmd.name)"
                >
                  <Star :size="12" :fill="favorites.has(cmd.name) ? 'currentColor' : 'none'" />
                </button>
              </div>
              <p class="cmd-desc">{{ cmd.shortDesc }}</p>
              <span :class="['category-badge', `cat-${cmd.category}`]">
                {{ categories.find(c => c.id === cmd.category)?.name }}
              </span>
            </div>

            <div v-if="filteredCommands.length === 0" class="empty-results">
              <template v-if="selectedCategory === 'custom' && customCommands.length === 0">
                <Upload :size="40" class="empty-icon" />
                <p class="empty-title">暂无自定义命令</p>
                <p class="empty-desc">点击上方导入按钮添加自定义命令</p>
              </template>
              <template v-else>
                <BookOpen :size="40" class="empty-icon" />
                <p class="empty-title">未找到匹配的命令</p>
                <p class="empty-desc">尝试调整搜索关键词或分类筛选</p>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：命令详情 -->
      <section class="tool-panel">
        <template v-if="selectedCommand">
          <div class="tool-panel-header">
            <div class="tool-panel-title">
              <span class="panel-icon green"><Terminal :size="14" /></span>
              <span>{{ selectedCommand.name }}</span>
              <span v-if="isCustomCommand(selectedCommand.name)" class="custom-badge">自定义</span>
            </div>
            <button v-if="isCustomCommand(selectedCommand.name)" class="action-btn danger" @click="deleteCustomCommand(selectedCommand.name)" @mouseenter="showTooltip('删除命令', $event)" @mouseleave="hideTooltip">
              <Trash2 :size="13" />
            </button>
          </div>

          <div class="tool-panel-body command-detail">
            <div class="detail-section">
              <h3 class="section-title">语法</h3>
              <div class="code-block">
                <code class="syntax-code">{{ selectedCommand.syntax }}</code>
                <button class="copy-btn" @click="copyToClipboard(selectedCommand.syntax, 'syntax')">
                  <Check v-if="copiedId === 'syntax'" :size="13" />
                  <Copy v-else :size="13" />
                </button>
              </div>
            </div>

            <div class="detail-section">
              <h3 class="section-title">描述</h3>
              <p class="description-text">{{ selectedCommand.description }}</p>
            </div>

            <div v-if="selectedCommand.options.length > 0" class="detail-section">
              <h3 class="section-title">选项</h3>
              <div class="options-table">
                <div v-for="opt in selectedCommand.options" :key="opt.flag" class="option-row">
                  <code class="option-flag">{{ opt.flag }}</code>
                  <span class="option-desc">{{ opt.desc }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedCommand.examples.length > 0" class="detail-section">
              <h3 class="section-title">示例</h3>
              <div class="examples-list">
                <div v-for="(ex, idx) in selectedCommand.examples" :key="idx" class="example-item">
                  <div class="code-block example-block" @click="copyToClipboard(ex.cmd, `ex-${idx}`)">
                    <code class="example-cmd">{{ ex.cmd }}</code>
                    <span class="copy-hint">
                      <Check v-if="copiedId === `ex-${idx}`" :size="13" />
                      <Copy v-else :size="13" />
                    </span>
                  </div>
                  <p class="example-desc">{{ ex.desc }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedCommand.tags.length > 0" class="detail-section">
              <h3 class="section-title">标签</h3>
              <div class="tags-list">
                <span v-for="tag in selectedCommand.tags" :key="tag" class="tag-badge">{{ tag }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="tool-panel-body empty-state">
            <div class="empty-content">
              <BookOpen :size="56" class="empty-icon" />
              <p class="empty-title">选择一个命令查看详情</p>
              <p class="empty-desc">从左侧列表中点击任意命令查看完整信息</p>
            </div>
          </div>
        </template>
      </section>
    </main>

    <!-- 导入弹框 -->
    <Teleport to="body">
      <div v-if="showImportPanel" class="modal-overlay" @click.self="toggleImportPanel">
        <div class="modal-dialog">
          <div class="modal-header">
            <div class="modal-title">
              <FileJson :size="16" />
              <span>导入自定义命令</span>
            </div>
            <button class="modal-close" @click="toggleImportPanel"><X :size="16" /></button>
          </div>
          <div class="modal-body">
            <div class="import-hint">
              <Info :size="13" />
              <span>粘贴 JSON 数组格式的命令数据。每个命令需包含 <code>name</code>、<code>shortDesc</code>、<code>syntax</code> 字段。分类字段请参考下方可用分类列表。</span>
            </div>
            <textarea
              v-model="importText"
              class="import-textarea"
              placeholder="粘贴 JSON 命令数据..."
              spellcheck="false"
              :rows="8"
            ></textarea>
            <details class="import-example">
              <summary>查看可用分类</summary>
              <div class="category-table">
                <div v-for="cat in importCategories" :key="cat.id" class="category-row" @click="copyToClipboard(cat.id, `cat-${cat.id}`)">
                  <code class="cat-id">{{ cat.id }}</code>
                  <span class="cat-label">{{ cat.name }}</span>
                  <span class="cat-copy-hint">
                    <Check v-if="copiedId === `cat-${cat.id}`" :size="11" />
                    <Copy v-else :size="11" />
                  </span>
                </div>
              </div>
            </details>
            <details class="import-example">
              <summary>查看 JSON 格式示例</summary>
              <div class="example-code-wrap">
                <pre class="example-code">{{ importExample }}</pre>
                <button class="example-copy-btn" @click="copyToClipboard(importExample, 'import-example')">
                  <Check v-if="copiedId === 'import-example'" :size="12" />
                  <Copy v-else :size="12" />
                </button>
              </div>
            </details>
          </div>
          <div class="modal-footer">
            <span class="config-path" @click="openConfigFile" title="点击打开配置文件所在目录">配置文件：{{ configPath }}</span>
            <div class="modal-actions">
              <button class="btn-cancel" @click="toggleImportPanel">取消</button>
              <button class="btn-primary" :disabled="importLoading || !importText.trim()" @click="importCommands">
                <Upload :size="12" />
                <span>{{ importLoading ? '导入中...' : '导入' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1;
  color: var(--accent);
  background: var(--accent-light);
  font-family: var(--font-mono);
}

.custom-tag {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.custom-badge {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 600;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  margin-left: 6px;
  letter-spacing: 0.3px;
}

.cmd-name-wrap {
  display: flex;
  align-items: center;
}

/* ===== Panel Actions ===== */
.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  padding: 0;
}

.action-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.action-btn.active {
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.1);
}

.action-btn.danger:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.tool-panel-body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Category Segment ===== */
.category-segment {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 14px 8px;
}

.category-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 12px;
  border: 1px solid transparent;
  background: var(--bg-tertiary);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.category-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-default);
}

.category-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.cat-count {
  font-size: 10px;
  opacity: 0.7;
  font-family: var(--font-mono);
}

.category-btn.active .cat-count {
  opacity: 0.9;
}

/* ===== Search ===== */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px 14px 10px;
}

.search-icon {
  position: absolute;
  left: 26px;
  font-size: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 28px 0 32px;
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--accent);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  position: absolute;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 50%;
  padding: 0;
}

.search-clear:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* ===== Command List ===== */
.command-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 10px 10px;
}

.command-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 4px;
  border: 1px solid transparent;
}

.command-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-subtle);
}

.command-item.selected {
  background: var(--accent-light);
  border-color: var(--accent);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.cmd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.cmd-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.3px;
}

.command-item.selected .cmd-name {
  color: var(--accent);
}

.fav-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
  opacity: 0;
  padding: 0;
}

.command-item:hover .fav-btn {
  opacity: 1;
}

.fav-btn:hover {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.fav-btn.active {
  opacity: 1;
  color: #fbbf24;
}

.cmd-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== Category Badges ===== */
.category-badge {
  display: inline-flex;
  padding: 2px 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.cat-file { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.cat-text { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.cat-network { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }
.cat-process { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.cat-user { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
.cat-disk { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.cat-compress { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.cat-system { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
.cat-package { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.cat-debug { background: rgba(249, 115, 22, 0.1); color: #f97316; }
.cat-shell { background: rgba(234, 179, 8, 0.1); color: #eab308; }
.cat-perf { background: rgba(14, 165, 233, 0.1); color: #0ea5e9; }
.cat-custom { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

/* ===== Empty State ===== */
.empty-results,
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
  opacity: 0.3;
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

/* ===== Command Detail ===== */
.command-detail {
  overflow-y: auto;
  padding: 20px 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
  margin-left: 4px;
}

/* ===== Code Block ===== */
.code-block {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #1e1e2e;
  border-radius: 8px;
  font-family: var(--font-mono);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.code-block .syntax-code,
.code-block .example-cmd {
  flex: 1;
  font-size: 13px;
  color: #cdd6f4;
  word-break: break-all;
  line-height: 1.5;
}

.copy-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #a6adc8;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #cdd6f4;
}

.copy-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: 8px;
  padding: 4px;
  color: #a6adc8;
  opacity: 0.4;
  transition: all var(--transition-fast);
}

.description-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
  padding: 8px 0;
}

.options-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.option-row:hover {
  background: var(--bg-hover);
}

.option-flag {
  min-width: 60px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  border-radius: 6px;
  text-align: center;
  flex-shrink: 0;
}

.option-desc {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.example-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.example-block {
  padding: 10px 14px;
  cursor: pointer;
}

.example-block:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.example-block:hover .copy-hint {
  opacity: 1;
}

.example-block::before {
  content: '$ ';
  color: #a6e3a1;
  font-weight: 600;
}

.example-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
  padding-left: 2px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-badge {
  display: inline-flex;
  padding: 3px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tag-badge:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-dialog {
  width: 560px;
  max-width: 90vw;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-default);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  padding: 0;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 16px 18px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid var(--border-subtle);
}

.config-path {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.config-path:hover {
  color: var(--accent);
  text-decoration: underline;
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  padding: 6px 14px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Import specifics ===== */
.import-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: var(--accent-light);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.import-hint code {
  padding: 1px 5px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 11px;
}

.category-table {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 4px;
  margin-top: 6px;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.category-row:hover {
  background: var(--bg-hover);
}

.cat-copy-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
  color: var(--text-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.category-row:hover .cat-copy-hint {
  opacity: 1;
}

.cat-id {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}

.cat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.import-textarea {
  width: 100%;
  min-height: 180px;
  padding: 10px 12px;
  font-size: 12px;
  font-family: var(--font-mono);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: vertical;
  outline: none;
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}

.import-textarea:focus {
  border-color: var(--accent);
}

.import-textarea::placeholder {
  color: var(--text-muted);
}

.import-example {
  margin-top: 12px;
}

.import-example summary {
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 0;
}

.import-example summary:hover {
  color: var(--text-primary);
}

.example-code-wrap {
  position: relative;
  margin: 8px 0 0;
}

.example-code {
  padding: 10px 12px;
  font-size: 11px;
  font-family: var(--font-mono);
  background: var(--bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  overflow-x: auto;
  white-space: pre;
  max-height: 160px;
  overflow-y: auto;
  margin: 0;
}

.example-copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  opacity: 0;
  transition: all var(--transition-fast);
}

.example-code-wrap:hover .example-copy-btn {
  opacity: 1;
}

.example-copy-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ===== Scrollbar ===== */
.command-list::-webkit-scrollbar,
.command-detail::-webkit-scrollbar {
  width: 5px;
}

.command-list::-webkit-scrollbar-thumb,
.command-detail::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 10px;
}

.command-list::-webkit-scrollbar-track,
.command-detail::-webkit-scrollbar-track {
  background: transparent;
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .tool-main {
    grid-template-columns: 1fr !important;
    grid-template-rows: 1fr 1fr;
  }

  .command-list {
    max-height: 300px;
  }

  .category-segment {
    justify-content: center;
  }
}

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  line-height: 1.4;
}
</style>
