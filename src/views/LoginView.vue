<template>
  <div class="card login-box">
    <div class="card-title">选课系统登录</div>
    <input class="form-input" v-model="form.userId"
           placeholder="账号（学生:2021001 / 管理员:admin）" @keyup.enter="submit" />
    <input class="form-input" type="password" v-model="form.password"
           placeholder="密码（学生:123456 / 管理员:admin123）" @keyup.enter="submit" />
    <button class="btn btn-primary login-btn" :disabled="loading" @click="submit">
      {{ loading ? '登录中...' : '登 录' }}
    </button>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { login, toast } from '../store.js'

const form = reactive({ userId: '', password: '' })
const loading = ref(false)

async function submit() {
  if (!form.userId.trim() || !form.password) {
    toast('请输入账号和密码', 'error')
    return
  }
  loading.value = true
  const res = await login(form.userId.trim(), form.password)
  loading.value = false
  if (res.code === 0) toast('欢迎，' + res.data.name, 'success')
  else toast(res.msg, 'error')
}
</script>

<style scoped>
.login-btn { width: 100%; padding: 10px; }
</style>