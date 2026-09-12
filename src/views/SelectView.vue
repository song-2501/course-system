<template>
  <div class="card">
    <div class="card-title">全部可选课程</div>
    <input class="form-input search-input" v-model="keyword" placeholder="🔍 按课程名称 / 教师搜索" />

    <table class="course-table">
      <thead>
        <tr>
          <th>课程名</th><th>教师</th><th>学分</th><th>上课时间</th>
          <th>周次</th><th>教室</th><th>状态</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in filteredCourses" :key="c.id">
          <td><span class="color-dot" :style="{ background: c.color }"></span>{{ c.name }}</td>
          <td>{{ c.teacher }}</td>
          <td>{{ c.credit }}</td>
          <td>{{ weekDayName(c.day) }} {{ periodName(c.period) }}</td>
          <td>{{ c.startWeek }}-{{ c.endWeek }}周</td>
          <td>{{ c.room }}</td>
          <td>
            <span v-if="isSelected(c)" class="badge-selected">已选</span>
            <span v-else-if="isFull(c)" class="badge-full">已满 {{ c.selectedIds.length }}/{{ c.capacity }}</span>
            <span v-else class="badge-ok">可选 {{ c.selectedIds.length }}/{{ c.capacity }}</span>
          </td>
          <td>
            <template v-if="currentUser.role === 'student'">
              <button v-if="!isSelected(c)" class="btn btn-primary"
                      :disabled="isFull(c) || submitting" @click="selectCourse(c)">选课</button>
              <button v-else class="btn btn-warn"
                      :disabled="submitting" @click="onDrop(c)">退课</button>
            </template>
            <span v-else class="muted">{{ c.selectedIds.length }}人已选</span>
          </td>
        </tr>
        <tr v-if="filteredCourses.length === 0">
          <td colspan="8" class="empty-tip">没有匹配的课程</td>
        </tr>
      </tbody>
    </table>

    <div v-if="currentUser.role === 'student'" class="stat-line">
      已选 <b class="num-blue">{{ myCourses.length }}</b> 门 · 共 <b class="num-green">{{ totalCredit }}</b> 学分
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { currentUser, courses, submitting, myCourses, totalCredit, selectCourse, dropCourse } from '../store.js'
import { weekDayName, periodName } from '../utils.js'

const keyword = ref('')
const debounced = ref('')
let timer = null
watch(keyword, (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => { debounced.value = val }, 300)
})

// 检索关键词预归一化，避免在每行过滤时重复 trim/toLowerCase
const normalizedKw = computed(() => debounced.value.trim().toLowerCase())

const filteredCourses = computed(() => {
  const kw = normalizedKw.value
  if (!kw) return courses.value
  return courses.value.filter(
    (c) => c.name.toLowerCase().includes(kw) || c.teacher.toLowerCase().includes(kw)
  )
})

// 已选课程 id 集合：一次构建 O(K)，每行判断已选降为 O(1)，
// 替代原先每行对 selectedIds 数组做 indexOf 的 O(N×M) 查找
const selectedIdSet = computed(() => new Set(myCourses.value.map((c) => c.id)))

const isSelected = (c) => selectedIdSet.value.has(c.id)
const isFull = (c) => c.selectedIds.length >= c.capacity

function onDrop(c) {
  if (confirm('确定退掉《' + c.name + '》吗？')) dropCourse(c)
}
</script>

<style scoped>
.search-input { max-width: 320px; }
.color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; }
.muted { color: #909399; font-size: 12px; }
.stat-line { margin-top: 12px; font-size: 14px; }
.num-blue { color: #409eff; }
.num-green { color: #67c23a; }
</style>
