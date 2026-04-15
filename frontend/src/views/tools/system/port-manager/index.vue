<script setup lang="ts">
import {
  Search,
  X,
  AlertTriangle,
  Zap,
  Check,
  Radio,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import Modal from '@/components/common/Modal.vue'
import { useTooltip } from '@/composables/useTooltip'
import { usePortManager } from './usePortManager'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  portInput, isSearching, searchedPort,
  portInfos, hasSearched, canSearch,
  lookupPort,
  showConfirmModal, confirmMessage,
  confirmKillProcess, confirmKillByPort, executeKill,
  clearResults, quickPorts, quickLookup,
} = usePortManager()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="端口管理器" icon="icon-port">
      <div class="header-content">
        <span v-if="hasSearched && portInfos.length > 0" class="port-stat danger">{{ portInfos.length }} 个进程</span>
        <span v-else-if="hasSearched && portInfos.length === 0" class="port-stat success">空闲</span>
      </div>
    </ToolTitleBar>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 搜索卡片 -->
      <div class="search-card">
        <div class="search-row">
          <div class="input-wrap">
            <input
              v-model="portInput"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              class="port-input"
              placeholder="输入端口号 (1-65535)"
              @keydown.enter="lookupPort"
            />
          </div>
          <button
            class="action-btn primary"
            :disabled="isSearching || !canSearch"
            @click="lookupPort"
            @mouseenter="showTooltip('查询端口', $event)"
            @mouseleave="hideTooltip"
          >
            <span v-if="isSearching" class="spinner"></span>
            <Search v-else :size="14" />
            <span>{{ isSearching ? '查询中' : '查询' }}</span>
          </button>
          <button
            v-if="hasSearched"
            class="action-btn"
            @click="clearResults"
            @mouseenter="showTooltip('清空', $event)"
            @mouseleave="hideTooltip"
          >
            <X :size="14" />
            <span>清空</span>
          </button>
        </div>

        <!-- 快速查询 -->
        <div class="quick-row">
          <span class="quick-label">快速查询</span>
          <div class="quick-btns">
            <button
              v-for="port in quickPorts"
              :key="port"
              class="quick-btn"
              @click="quickLookup(port)"
            >
              {{ port }}
            </button>
          </div>
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="result-area">
        <!-- 未占用 -->
        <div v-if="hasSearched && portInfos.length === 0" class="result-card">
          <div class="tool-empty">
            <div class="empty-icon" style="background: var(--success-light); color: var(--success);"><Check :size="24" /></div>
            <p class="empty-title">端口未被占用</p>
            <p class="empty-desc">端口 {{ searchedPort }} 当前没有进程占用</p>
          </div>
        </div>

        <!-- 结果列表 -->
        <div v-else-if="hasSearched && portInfos.length > 0" class="result-card">
          <div class="result-header">
            <div class="result-title">
              <span class="dot red"></span>
              <span>端口 {{ searchedPort }} 占用情况</span>
              <span class="count">{{ portInfos.length }} 个进程</span>
            </div>
            <button class="action-btn danger" @click="confirmKillByPort">
              <X :size="14" />
              <span>终止全部</span>
            </button>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>协议</th>
                  <th>PID</th>
                  <th>进程名</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(info, index) in portInfos" :key="index">
                  <td>
                    <span class="badge" :class="info.protocol.toLowerCase()">
                      {{ info.protocol }}
                    </span>
                  </td>
                  <td class="mono">{{ info.pid }}</td>
                  <td>{{ info.process }}</td>
                  <td class="state">{{ info.state }}</td>
                  <td>
                    <button class="btn-text-danger" @click="confirmKillProcess(info.pid)">终止</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="warning-bar">
            <AlertTriangle :size="14" />
            <span>终止进程可能导致数据丢失，请确认后再操作</span>
          </div>
        </div>

        <!-- 初始状态 -->
        <div v-else class="result-card">
          <div class="tool-empty">
            <div class="empty-icon"><Zap :size="24" /></div>
            <p class="empty-title">端口管理器</p>
            <p class="empty-desc">输入端口号查询占用情况，支持终止进程</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 终止确认弹窗 -->
    <Modal v-model:visible="showConfirmModal" title="确认终止" width="400px">
      <div class="confirm-body">
        <div class="confirm-icon"><AlertTriangle :size="22" /></div>
        <p class="confirm-msg">{{ confirmMessage }}</p>
      </div>
      <template #footer>
        <button class="modal-cancel-btn" @click="showConfirmModal = false">取消</button>
        <button class="modal-danger-btn" @click="executeKill">确认终止</button>
      </template>
    </Modal>

    <!-- Tooltip -->
    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
      {{ tooltip.text }}
    </div>
  </div>
</template>

<style scoped>
/* ====== 标题栏 ====== */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
}

.port-stat {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
}

.port-stat.danger {
  color: var(--error);
  background: var(--error-light);
}

.port-stat.success {
  color: var(--success);
  background: var(--success-light);
}

/* ====== 内容区域 ====== */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

/* ====== 搜索卡片 ====== */
.search-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-wrap {
  flex: 1;
  max-width: 280px;
}

.port-input {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.15s;
}

.port-input:hover { border-color: var(--border-default); }
.port-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-light); }
.port-input::placeholder { color: var(--text-muted); }

/* ====== 操作按钮 ====== */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.action-btn:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--border-default);
  background: var(--bg-hover);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.primary {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
  color: #fff;
}

.action-btn.danger {
  color: #fff;
  background: var(--error);
  border-color: var(--error);
}

.action-btn.danger:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-text-danger {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--error);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-text-danger:hover {
  background: var(--error-light);
  border-color: var(--error);
}

/* ====== 快速查询 ====== */
.quick-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quick-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.quick-btns {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.quick-btn {
  padding: 3px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}

.quick-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-light);
}

/* ====== 结果区域 ====== */
.result-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.red {
  background: var(--error);
}

.count {
  padding: 2px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

/* ====== 表格 ====== */
.table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-subtle);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead {
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}

.data-table th {
  padding: 8px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table .mono {
  font-family: var(--font-mono);
  font-size: 12px;
}

.data-table .state {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ====== 协议徽章 ====== */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-xs);
}

.badge.tcp {
  color: var(--accent);
  background: var(--accent-light);
}

.badge.udp {
  color: var(--warning);
  background: var(--warning-light);
}

/* ====== 警告条 ====== */
.warning-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--warning);
  background: var(--warning-light);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

/* ====== 加载动画 ====== */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== 确认弹窗 ====== */
.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4px 0 8px;
}

.confirm-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--warning) 14%, transparent);
  color: var(--warning);
  border-radius: 14px;
  margin-bottom: 18px;
  position: relative;
}

.confirm-icon::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 18px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%);
  opacity: 0.5;
}

.confirm-msg {
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-primary);
  margin: 0;
}

.modal-cancel-btn {
  height: 38px;
  padding: 0 24px;
  font-size: 13px;
  font-weight: 550;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-cancel-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.modal-cancel-btn:active {
  transform: translateY(0) scale(0.98);
}

.modal-danger-btn {
  height: 38px;
  padding: 0 24px;
  font-size: 13px;
  font-weight: 550;
  color: #fff;
  background: var(--error);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 3px color-mix(in srgb, var(--error) 25%, transparent),
    0 0 0 1px color-mix(in srgb, var(--error) 15%, transparent) inset;
}

.modal-danger-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}

.modal-danger-btn:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow:
    0 4px 14px color-mix(in srgb, var(--error) 30%, transparent),
    0 0 0 1px color-mix(in srgb, var(--error) 15%, transparent) inset;
}

.modal-danger-btn:active {
  filter: brightness(0.96);
  transform: translateY(0) scale(0.98);
}

/* ====== Tooltip ====== */
.toolbar-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-inverse, #fff);
  background: var(--bg-tooltip, rgba(0, 0, 0, 0.85));
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  min-width: 60px;
  text-align: center;
}

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .input-wrap { max-width: none; }
  .search-row { flex-wrap: wrap; }
}
</style>
