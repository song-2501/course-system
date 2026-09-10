<template>
  <div class="page">
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="'toast-' + t.type">
        {{ t.msg }}
      </div>
    </div>

    <LoginView v-if="!currentUser" />

    <template v-else>
      <div class="header">
        <h1>📚 课程表 + 选课系统</h1>
        <div class="user-info">
          {{ currentUser.name }}（{{ currentUser.role === 'admin' ? '管理员' : '学生' }}）
          <button class="btn btn-ghost" @click="handleLogout">退出登录</button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn" :class="{ active: tab === 'select' }" @click="tab = 'select'">选课中心</button>
        <button class="tab-btn" :class="{ active: tab === 'schedule' }" @click="tab = 'schedule'">我的课程表</button>
        <button v-if="currentUser.role === 'admin'" class="tab-btn" :class="{ active: tab === 'manage' }" @click="tab = 'manage'">课程管理</button>
      </div>

      <SelectView v-if="tab === 'select'" />
      <ScheduleView v-if="tab === 'schedule'" />
      <ManageView v-if="tab === 'manage' && currentUser.role === 'admin'" />
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { currentUser, toasts, logout, toast } from './store.js'
import LoginView from './views/LoginView.vue'
import SelectView from './views/SelectView.vue'
import ScheduleView from './views/ScheduleView.vue'
import ManageView from './views/ManageView.vue'

const tab = ref(currentUser.value && currentUser.value.role === 'admin' ? 'manage' : 'select')

watch(currentUser, (u) => {
  if (u) tab.value = u.role === 'admin' ? 'manage' : 'select'
})

async function handleLogout() {
  await logout()
  toast('已退出登录', 'info')
}
</script>