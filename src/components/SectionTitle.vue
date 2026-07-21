<template>
  <div class="meos-section-title-wrap">
    <div class="meos-title-left" :class="[`size-${size}`]">
      <span class="vertical-line"></span>
      <h3 class="title-text">{{ title }}</h3>
    </div>
    <!-- 可变插槽，右侧常用于放置操作按钮如"新增"、"导出"等 -->
    <div class="title-extra" v-if="$slots.extra">
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /** 区块标题文字 */
  title: {
    type: String,
    required: true
  },
  /**
   * 标题尺寸：
   * - '16px': 大号区块标题（默认），适用于页面级或大模块
   * - '14px': 小号区块标题，适用于卡片内部或较小模组
   */
  size: {
    type: String,
    default: '16px',
    validator: (v) => ['14px', '16px'].includes(v)
  }
})
</script>

<style scoped>
.meos-section-title-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.meos-title-left {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.vertical-line {
  background-color: var(--primary-color);
}

.title-text {
  margin: 0;
  color: var(--title-color);
  font-weight: 500;
}

/* ==== 16px 尺寸规格 ==== */
.size-16px .vertical-line {
  width: 3px;
  height: 14px; 
}
.size-16px .title-text {
  font-size: var(--font-xl, 16px);
  line-height: var(--line-xl, 24px);
}

/* ==== 14px 尺寸规格 ==== */
.size-14px .vertical-line {
  width: 3px;
  height: 14px; 
}
.size-14px .title-text {
  font-size: var(--font-m, 14px);
  line-height: 22px;
}

.title-extra {
  display: flex;
  align-items: center;
  gap: var(--padding-2, 8px);
}
</style>
