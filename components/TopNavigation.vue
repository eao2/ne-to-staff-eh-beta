<template>
  <nav class="top-nav">
    <NuxtLink to="/" class="nav-link" :class="{ active: route.path === '/' }">
      抵达二连浩特
    </NuxtLink>
    <NuxtLink to="/in-transit" class="nav-link" :class="{ active: route.path === '/in-transit' }">
      寄送至乌兰巴托
    </NuxtLink>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style lang="scss" scoped>
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .nav-link {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #666;
    font-weight: 500;
    position: relative;
    transition: color 0.3s;

    &.active {
      color: #1a73e8;

      &:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background-color: #1a73e8;
      }
    }

    &:hover {
      color: #1a73e8;
    }
  }
}
</style> 