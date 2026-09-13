<template>
  <div class="login-page">
    <div class="card login-box">
      <div class="card-title">选课系统登录</div>
      <input class="form-input" v-model="form.userId"
             placeholder="账号" @keyup.enter="submit" />
      <input class="form-input" type="password" v-model="form.password"
             placeholder="密码" @keyup.enter="submit" />
      <button class="btn btn-primary login-btn" :disabled="loading" @click="submit">
        {{ loading ? '登录中...' : '登 录' }}
      </button>
    </div>
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
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background:
    radial-gradient(1000px 520px at 12% 8%, rgba(64, 158, 255, 0.28), transparent 62%),
    radial-gradient(900px 520px at 88% 92%, rgba(103, 194, 58, 0.16), transparent 62%),
    linear-gradient(135deg, #0e2140 0%, #1b3a66 55%, #2a5590 100%);
}
.login-box {
  width: 360px;
  max-width: 92vw;
  margin: 0;
  box-shadow: 0 18px 50px rgba(4, 16, 34, 0.45);
}
.login-btn { width: 100%; padding: 10px; }
</style>