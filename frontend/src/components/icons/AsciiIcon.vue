<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <!-- 外框：终端/代码风格 -->
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <!-- 顶部装饰横线 -->
    <line x1="7" y1="8" x2="17" y2="8" />
    <!-- 字符 A（代表 ASCII） -->
    <path d="M9 13 L12 10 L15 13" />
    <!-- 底部二进制点缀 -->
    <line x1="8" y1="16" x2="10" y2="16" />
    <line x1="12" y1="16" x2="14" y2="16" />
    <line x1="16" y1="16" x2="17" y2="16" />
  </svg>
</template>

<script lang="ts">
export default {
  name: 'AsciiIcon'
}
</script>
