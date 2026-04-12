import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { TOOL_DEFINITIONS } from '@/tools/definitions'

// 已实现工具的组件映射
const toolComponentMap: Record<string, () => Promise<any>> = {
  'json-formatter': () => import('@/views/tools/dev/json-formatter/index.vue'),
  'json-schema': () => import('@/views/tools/dev/json-schema/index.vue'),
  'jwt': () => import('@/views/tools/security/jwt/index.vue'),
  'base64': () => import('@/views/tools/encode/base64/index.vue'),
  'timestamp': () => import('@/views/tools/time/timestamp/index.vue'),
  'calendar': () => import('@/views/tools/time/calendar/index.vue'),
  'diff': () => import('@/views/tools/text/diff/index.vue'),
  'qrcode': () => import('@/views/tools/other/qrcode/index.vue'),
  'port': () => import('@/views/tools/system/port-manager/index.vue'),
  'jdk': () => import('@/views/tools/system/jdk/index.vue'),
  'regex': () => import('@/views/tools/dev/regex/index.vue'),
  'cron': () => import('@/views/tools/dev/cron/index.vue'),
  'xml-formatter': () => import('@/views/tools/dev/xml-formatter/index.vue'),
  'linux-commands': () => import('@/views/tools/dev/linux-commands/index.vue'),
  'hash': () => import('@/views/tools/security/hash/index.vue'),
  'crypto': () => import('@/views/tools/security/crypto/index.vue'),
  'url': () => import('@/views/tools/encode/url/index.vue'),
  'unicode': () => import('@/views/tools/encode/unicode/index.vue'),
  'ascii': () => import('@/views/tools/encode/ascii/index.vue'),
  'markdown': () => import('@/views/tools/text/markdown/index.vue'),
  'color-picker': () => import('@/views/tools/other/color-picker/index.vue'),
  'uuid': () => import('@/views/tools/other/uuid/index.vue'),
  'env-vars': () => import('@/views/tools/system/env-vars/index.vue'),
}

const fallbackComponent = () => import('@/views/tools/ToolWrapper.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/tools',
      name: 'Tools',
      component: () => import('@/views/ToolsPage.vue'),
      meta: { title: '工具箱' },
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '未找到' },
    },
  ],
})

// 动态注册工具路由
TOOL_DEFINITIONS.forEach(tool => {
  router.addRoute({
    path: tool.route,
    name: `tool-${tool.id}`,
    component: toolComponentMap[tool.id] || fallbackComponent,
    meta: { title: tool.name, isToolWindow: true, toolId: tool.id },
  } as RouteRecordRaw)
})

export default router
