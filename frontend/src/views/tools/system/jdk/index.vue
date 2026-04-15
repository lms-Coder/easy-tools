<script setup lang="ts">
import {
  Check, Trash2, Edit3, Plus, RefreshCw, Settings,
  Folder, Shield, X, Link, Info, ArrowRightLeft,
} from 'lucide-vue-next'
import ToolTitleBar from '@/components/common/ToolTitleBar.vue'
import Popover from '@/components/common/Popover.vue'
import { useTooltip } from '@/composables/useTooltip'
import { useJdkManager } from './useJdkManager'

const { tooltip, showTooltip, hideTooltip } = useTooltip()

const {
  jdkVersions,
  currentJDK,
  linkPath,
  isLoading,
  switchingIndex,
  editingIndex,
  editForm,
  showAddForm,
  newJdk,
  editingLinkPath,
  editLinkPathForm,
  loadJDKList,
  switchJDK,
  startEdit,
  cancelEdit,
  saveEdit,
  deleteJDK,
  showAdd,
  cancelAdd,
  addJDK,
  isCurrentJDK,
  startEditLinkPath,
  cancelEditLinkPath,
  saveEditLinkPath,
} = useJdkManager()
</script>

<template>
  <div class="tool-page">
    <!-- 标题栏 -->
    <ToolTitleBar title="JDK 版本管理" icon="icon-jdk">
      <div class="header-content">
        <span v-if="currentJDK" class="current-tag">
          <span class="dot"></span>
          {{ currentJDK.name }}
        </span>
        <span v-if="jdkVersions.length" class="count-tag">{{ jdkVersions.length }} 个版本</span>
      </div>
    </ToolTitleBar>

    <!-- 主内容 -->
    <main class="content">
      <!-- 配置卡片 -->
      <div class="config-card">
        <div class="config-header">
          <div class="config-title">
            <Settings :size="14" class="title-icon" />
            <span>配置</span>
          </div>
        </div>
        <div class="config-body">
          <div class="config-row">
            <div class="config-label">
              <Link :size="12" />
              <span>链接路径</span>
            </div>
            <div class="config-value" v-if="!editingLinkPath">
              <code class="path-display">{{ linkPath || '未设置' }}</code>
              <button class="cfg-btn" @click="startEditLinkPath" @mouseenter="showTooltip('编辑', $event)" @mouseleave="hideTooltip">
                <Edit3 :size="12" />
              </button>
            </div>
            <div class="config-edit" v-else>
              <input v-model="editLinkPathForm" type="text" class="cfg-input" placeholder="如: D:\tools\jdk\current" @keyup.enter="saveEditLinkPath" />
              <button class="cfg-btn" @click="cancelEditLinkPath"><X :size="12" /></button>
              <button class="cfg-btn ok" @click="saveEditLinkPath"><Check :size="12" /></button>
            </div>
          </div>
          <div class="config-divider"></div>
          <div class="config-row">
            <div class="config-label">
              <ArrowRightLeft :size="12" />
              <span>当前 JDK</span>
            </div>
            <div class="config-value" v-if="currentJDK">
              <span class="jdk-active-name">{{ currentJDK.name }}</span>
              <code class="path-display small">{{ currentJDK.path }}</code>
            </div>
            <div class="config-value" v-else>
              <span class="text-muted">未设置</span>
            </div>
          </div>
          <div class="config-divider"></div>
          <div class="config-footer">
            <span class="config-footer-hint">管理本地已安装的 JDK 版本，通过符号链接快速切换</span>
            <div class="config-footer-actions">
              <button class="cfg-refresh-btn" @click="loadJDKList" :disabled="isLoading" @mouseenter="showTooltip('刷新', $event)" @mouseleave="hideTooltip">
                <RefreshCw :size="13" :class="{ spinning: isLoading }" />
              </button>
              <button class="cfg-add-btn" @click="showAdd" @mouseenter="showTooltip('添加 JDK', $event)" @mouseleave="hideTooltip">
                <Plus :size="13" />
                <span>添加 JDK</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加表单 -->
      <div v-if="showAddForm" class="add-card">
        <div class="add-header">
          <Plus :size="14" class="title-icon" />
          <span>添加 JDK</span>
        </div>
        <div class="add-body">
          <div class="form-group">
            <label class="form-label">名称</label>
            <input v-model="newJdk.name" type="text" class="cfg-input" placeholder="如: JDK 21" @keyup.enter="addJDK" />
          </div>
          <div class="form-group flex-1">
            <label class="form-label">路径</label>
            <input v-model="newJdk.path" type="text" class="cfg-input" placeholder="如: D:\tools\jdk\jdk21" @keyup.enter="addJDK" />
          </div>
          <div class="add-actions">
            <button class="cfg-btn-text" @click="cancelAdd">取消</button>
            <button class="cfg-btn-accent" @click="addJDK">添加</button>
          </div>
        </div>
      </div>

      <!-- JDK 列表卡片 -->
      <div class="list-card">
        <div class="list-header">
          <div class="list-title">
            <Shield :size="14" class="title-icon" />
            <span>JDK 版本列表</span>
            <span v-if="jdkVersions.length" class="badge-count">{{ jdkVersions.length }}</span>
          </div>
        </div>
        <div class="list-body">
          <div v-if="jdkVersions.length" class="jdk-list">
            <div
              v-for="(jdk, index) in jdkVersions"
              :key="index"
              class="jdk-item"
              :class="{ active: isCurrentJDK(jdk) }"
            >
              <!-- 编辑模式 -->
              <div v-if="editingIndex === index" class="item-edit">
                <input v-model="editForm.name" type="text" class="cfg-input short" placeholder="名称" />
                <input v-model="editForm.path" type="text" class="cfg-input" placeholder="路径" @keyup.enter="saveEdit" />
                <button class="cfg-btn" @click="cancelEdit"><X :size="13" /></button>
                <button class="cfg-btn ok" @click="saveEdit"><Check :size="13" /></button>
              </div>

              <!-- 展示模式 -->
              <template v-else>
                <div class="item-indicator">
                  <span v-if="isCurrentJDK(jdk)" class="active-dot"></span>
                  <span v-else class="idx">{{ index + 1 }}</span>
                </div>
                <div class="item-info">
                  <span class="item-name">{{ jdk.name }}</span>
                  <span class="item-path">{{ jdk.path }}</span>
                </div>
                <div class="item-actions">
                  <Popover v-if="!isCurrentJDK(jdk) && switchingIndex !== index" placement="bottom" :offset="6">
                    <template #trigger>
                      <button class="switch-btn" :disabled="isLoading">切换</button>
                    </template>
                    <template #default="{ close }">
                      <div class="switch-popover">
                        <div class="switch-popover-title">切换 JDK 版本？</div>
                        <div class="switch-popover-desc">
                          将符号链接指向 <strong>{{ jdk.name }}</strong>
                        </div>
                        <div class="switch-popover-path">{{ jdk.path }}</div>
                        <div class="switch-popover-actions">
                          <button class="popover-cancel" @click="close">取消</button>
                          <button class="popover-confirm" @click="switchJDK(index)">确认切换</button>
                        </div>
                      </div>
                    </template>
                  </Popover>
                  <span v-else-if="switchingIndex === index" class="switching-tag">
                    <span class="spinner"></span>
                    切换中
                  </span>
                  <span v-else class="using-tag">
                    <Check :size="10" />
                    使用中
                  </span>
                  <button class="cfg-btn small" @click="startEdit(index)" @mouseenter="showTooltip('编辑', $event)" @mouseleave="hideTooltip">
                    <Edit3 :size="12" />
                  </button>
                  <button class="cfg-btn small danger" @click="deleteJDK(index)" @mouseenter="showTooltip('删除', $event)" @mouseleave="hideTooltip">
                    <Trash2 :size="12" />
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="tool-empty">
            <div class="empty-icon"><Folder :size="24" /></div>
            <p class="empty-title">暂无 JDK</p>
            <p class="empty-desc">点击工具栏 + 添加 JDK 版本</p>
          </div>
        </div>
      </div>

      <!-- 底部说明 -->
      <div class="tips-bar">
        <Info :size="12" />
        <span>将 <code>JAVA_HOME</code> 指向链接路径，切换后重启终端生效</span>
      </div>
    </main>

    <div v-if="tooltip.show" class="toolbar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
  </div>
</template>

<style scoped>
/* ====== 标题栏 ====== */
.current-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-light);
  border-radius: var(--radius-xs);
}

.current-tag .dot {
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
}

.count-tag {
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

/* ====== 卡片底部 ====== */
.config-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-footer-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.config-footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cfg-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.12s;
}

.cfg-add-btn:hover { filter: brightness(1.1); }

.cfg-refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.12s;
}

.cfg-refresh-btn:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--border-default);
}

.cfg-refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

/* ====== 配置卡片 ====== */
.config-card,
.add-card,
.list-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.list-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.config-header,
.add-header,
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.config-title,
.add-header,
.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.title-icon { color: var(--accent); }

.config-body {
  padding: 12px 16px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.config-edit {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.path-display {
  padding: 5px 10px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.path-display.small {
  font-size: 11px;
  padding: 3px 8px;
}

.jdk-active-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--success);
}

.text-muted { font-size: 12px; color: var(--text-muted); }

.config-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 10px 0;
}

/* ====== 输入框 & 按钮（GUI 风格） ====== */
.cfg-input {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  outline: none;
  transition: border-color 0.15s;
}

.cfg-input:focus { border-color: var(--accent); }
.cfg-input::placeholder { color: var(--text-muted); }
.cfg-input.short { width: 130px; }

/* 通用小图标按钮（24px，无背景） */
.cfg-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-xs);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.12s;
  flex-shrink: 0;
}

.cfg-btn:hover { color: var(--text-primary); background: var(--bg-hover); }
.cfg-btn.ok:hover { color: var(--success); background: var(--success-light); }
.cfg-btn.danger:hover { color: var(--error); background: var(--error-light); }
.cfg-btn.small { width: 22px; height: 22px; }

/* 文本按钮 */
.cfg-btn-text {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.12s;
}

.cfg-btn-text:hover { background: var(--bg-hover); color: var(--text-primary); }

/* 强调按钮 */
.cfg-btn-accent {
  height: 28px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.12s;
}

.cfg-btn-accent:hover { filter: brightness(1.08); }

/* ====== 添加表单 ====== */
.add-body {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.flex-1 { flex: 1; min-width: 0; }

.add-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* ====== JDK 列表 ====== */
.badge-count {
  padding: 2px 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}

.list-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 6px;
}

.jdk-list {
  display: flex;
  flex-direction: column;
}

.jdk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  transition: all 0.12s;
  border: 1px solid transparent;
}

.jdk-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-subtle);
}

.jdk-item.active {
  background: var(--success-light);
  border-color: color-mix(in srgb, var(--success) 20%, transparent);
}

.item-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.active-dot {
  width: 24px;
  height: 24px;
  background: var(--success);
  border-radius: 50%;
  position: relative;
}

.active-dot::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--text-inverse, #fff);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.idx {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.item-path {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  margin-top: 1px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.switch-btn {
  height: 26px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.12s;
}

.switch-btn:hover:not(:disabled) { color: #fff; background: var(--accent); }
.switch-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.using-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--success);
  background: var(--success-light);
  border-radius: var(--radius-xs);
}

.switching-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  border-radius: var(--radius-xs);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ====== 编辑行 ====== */
.item-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

/* ====== 底部说明 ====== */
.tips-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.tips-bar code {
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--bg-secondary);
  padding: 1px 4px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

/* ====== 加载 ====== */
.spinning { animation: spin 1s linear infinite; }

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== 切换确认气泡 ====== */
.switch-popover {
  min-width: 200px;
  padding: 4px 0;
}

.switch-popover-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.switch-popover-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.switch-popover-desc strong {
  color: var(--accent);
}

.switch-popover-path {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  margin-bottom: 10px;
  word-break: break-all;
}

.switch-popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.popover-cancel {
  height: 26px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.12s;
}

.popover-cancel:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.popover-confirm {
  height: 26px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all 0.12s;
}

.popover-confirm:hover {
  filter: brightness(1.08);
}

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .config-row { flex-wrap: wrap; }
  .add-body { flex-wrap: wrap; }
  .item-edit { flex-wrap: wrap; }
}
</style>
