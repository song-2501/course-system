<template>
  <div class="card">
    <div class="card-title">{{ currentUser.role === 'admin' ? '课程池总览（按周）' : '我的课程表' }}</div>

    <div class="week-bar">
      <button class="btn btn-ghost" @click="prevWeek">‹</button>
      <select class="form-input week-select" v-model.number="currentWeek">
        <option v-for="w in TOTAL_WEEKS" :key="w" :value="w">第 {{ w }} 周</option>
      </select>
      <button class="btn btn-ghost" @click="nextWeek">›</button>
      <button class="btn btn-primary export-btn" @click="exportSchedule">📄 导出课表(文本)</button>
    </div>

    <div class="schedule-grid">
      <div class="schedule-row schedule-header">
        <div class="schedule-cell time-cell">时间</div>
        <div class="schedule-cell" v-for="d in 7" :key="d">{{ weekDayName(d - 1) }}</div>
      </div>
      <div class="schedule-row" v-for="p in 5" :key="p">
        <div class="schedule-cell time-cell">{{ periodName(p - 1) }}</div>
        <div class="schedule-cell" v-for="d in 7" :key="d">
          <div v-for="c in cellCourses(d - 1, p - 1)" :key="c.id"
               class="course-block" :style="{ background: c.color }" @click="detail = c">
            <div class="cb-name">{{ c.name }}</div>
            <div>{{ c.teacher }}</div>
            <div>{{ c.room }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="detail" class="modal-mask" @click.self="detail = null">
      <div class="modal-box">
        <div class="card-title">{{ detail.name }}</div>
        <p class="detail-text">
          教师：{{ detail.teacher }}<br />
          时间：{{ weekDayName(detail.day) }} {{ periodName(detail.period) }}<br />
          周次：第 {{ detail.startWeek }} - {{ detail.endWeek }} 周<br />
          教室：{{ detail.room }}<br />
          学分：{{ detail.credit }}<br />
          容量：{{ detail.selectedIds.length }} / {{ detail.capacity }}
        </p>
        <button class="btn btn-primary modal-close" @click="detail = null">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { currentUser, courses, myCourses, toast } from '../store.js'
import { weekDayName, periodName, TOTAL_WEEKS, WEEK_DAYS, PERIODS } from '../utils.js'

const currentWeek = ref(1)
const detail = ref(null)

const prevWeek = () => { if (currentWeek.value > 1) currentWeek.value-- }
const nextWeek = () => { if (currentWeek.value < TOTAL_WEEKS) currentWeek.value++ }

function cellCourses(d, p) {
  const list = currentUser.value.role === 'admin' ? courses.value : myCourses.value
  const w = currentWeek.value
  return list.filter((c) => c.day === d && c.period === p && w >= c.startWeek && w <= c.endWeek)
}

function exportSchedule() {
  const list = currentUser.value.role === 'admin' ? courses.value : myCourses.value
  const w = currentWeek.value
  const lines = ['第 ' + w + ' 周课程表', '========================']
  for (let d = 0; d < 7; d++) {
    for (let p = 0; p < 5; p++) {
      list.forEach((c) => {
        if (c.day === d && c.period === p && w >= c.startWeek && w <= c.endWeek) {
          lines.push(WEEK_DAYS[d] + ' ' + PERIODS[p] + '  ' + c.name + '（' + c.teacher + ' @' + c.room + '）')
        }
      })
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '课程表_第' + w + '周.txt'
  a.click()
  URL.revokeObjectURL(a.href)
  toast('课表已导出', 'success')
}
</script>

<style scoped>
.week-select { width: auto; margin: 0; }
.export-btn { margin-left: auto; }
.detail-text { font-size: 14px; line-height: 2; }
.modal-close { width: 100%; margin-top: 10px; }
</style>