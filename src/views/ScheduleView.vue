<template>
  <div class="card">
    <div class="card-title">{{ isAdmin ? '课程表编排（点击空格排课，点击课程块调整）' : '我的课程表' }}</div>

    <div class="week-bar">
      <button class="btn btn-ghost" @click="prevWeek">‹</button>
      <select class="form-input week-select" v-model.number="currentWeek">
        <option v-for="w in TOTAL_WEEKS" :key="w" :value="w">第 {{ w }} 周</option>
      </select>
      <button class="btn btn-ghost" @click="nextWeek">›</button>
      <span v-if="isAdmin" class="admin-tag">管理员编排模式</span>
      <button class="btn btn-primary export-btn" @click="exportSchedule">📄 导出课表(文本)</button>
    </div>

    <div class="schedule-grid">
      <div class="schedule-row schedule-header">
        <div class="schedule-cell time-cell">时间</div>
        <div class="schedule-cell" v-for="d in 7" :key="d">{{ weekDayName(d - 1) }}</div>
      </div>
      <div class="schedule-row" v-for="p in 5" :key="p">
        <div class="schedule-cell time-cell">{{ periodName(p - 1) }}</div>
        <div class="schedule-cell" v-for="d in 7" :key="d"
             :class="{ editable: isAdmin }"
             @click="isAdmin && openAssign(d - 1, p - 1)">
          <div v-for="c in cellCourses(d - 1, p - 1)" :key="c.id"
               class="course-block" :style="{ background: c.color }"
               @click.stop="onBlockClick(c)">
            <div class="cb-name">{{ c.name }}</div>
            <div>{{ c.teacher }}</div>
            <div>{{ c.room }}</div>
          </div>
          <div v-if="isAdmin && cellCourses(d - 1, p - 1).length === 0" class="cell-add">＋</div>
        </div>
      </div>
    </div>

    <div v-if="!isAdmin" class="stat-line">
      本周共 <b class="num-blue">{{ weekCount }}</b> 门课 · 已选 <b class="num-green">{{ totalCredit }}</b> 学分
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

    <div v-if="assign.show" class="modal-mask" @click.self="assign.show = false">
      <div class="modal-box">
        <div class="card-title">
          排课到 {{ weekDayName(assign.day) }} {{ periodName(assign.period) }}
        </div>
        <div class="assign-hint">选择一门课程放到该时段，其上课时间将同步更新，学生端课表随即生效。</div>
        <div class="assign-list">
          <div v-for="c in assignableCourses" :key="c.id" class="assign-item"
               @click="doAssign(c)">
            <span class="color-dot" :style="{ background: c.color }"></span>
            <span class="assign-name">{{ c.name }}</span>
            <span class="assign-meta">{{ c.teacher }} · 现 {{ weekDayName(c.day) }} {{ periodName(c.period) }}</span>
          </div>
          <div v-if="assignableCourses.length === 0" class="empty-tip">课程池中暂无可排课程</div>
        </div>
        <button class="btn btn-ghost modal-close" @click="assign.show = false">取消</button>
      </div>
    </div>

    <div v-if="edit.show" class="modal-mask" @click.self="edit.show = false">
      <div class="modal-box">
        <div class="card-title">调整排课：{{ edit.form.name }}</div>
        <div class="row">
          <select class="form-input" v-model.number="edit.form.day">
            <option v-for="d in 7" :key="d" :value="d - 1">{{ weekDayName(d - 1) }}</option>
          </select>
          <select class="form-input" v-model.number="edit.form.period">
            <option v-for="p in 5" :key="p" :value="p - 1">{{ periodName(p - 1) }}</option>
          </select>
        </div>
        <div class="row">
          <input class="form-input" type="number" min="1" :max="TOTAL_WEEKS"
                 v-model.number="edit.form.startWeek" placeholder="开始周" />
          <input class="form-input" type="number" min="1" :max="TOTAL_WEEKS"
                 v-model.number="edit.form.endWeek" placeholder="结束周" />
        </div>
        <input class="form-input" v-model="edit.form.room" placeholder="教室" />
        <div class="edit-info">
          已选 {{ edit.form.selectedIds.length }} 人 · {{ edit.form.credit }} 学分
        </div>
        <div class="row">
          <button class="btn btn-primary grow" :disabled="submitting" @click="saveEdit">保存排课</button>
          <button class="btn btn-danger grow" :disabled="submitting" @click="removeFromSchedule">移出课表</button>
        </div>
        <button class="btn btn-ghost modal-close" @click="edit.show = false">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { currentUser, courses, myCourses, totalCredit, submitting, toast,
         updateCourseFields, removeCourse } from '../store.js'
import { weekDayName, periodName, TOTAL_WEEKS, WEEK_DAYS, PERIODS } from '../utils.js'

const isAdmin = computed(() => currentUser.value && currentUser.value.role === 'admin')
const currentWeek = ref(1)
const detail = ref(null)
const assign = reactive({ show: false, day: 0, period: 0 })
const edit = reactive({ show: false, form: {} })

const prevWeek = () => { if (currentWeek.value > 1) currentWeek.value-- }
const nextWeek = () => { if (currentWeek.value < TOTAL_WEEKS) currentWeek.value++ }

const visibleList = computed(() => (isAdmin.value ? courses.value : myCourses.value))

const weekCount = computed(() => {
  const w = currentWeek.value
  return visibleList.value.filter((c) => w >= c.startWeek && w <= c.endWeek).length
})

function cellCourses(d, p) {
  const w = currentWeek.value
  return visibleList.value.filter((c) => c.day === d && c.period === p && w >= c.startWeek && w <= c.endWeek)
}

const assignableCourses = computed(() =>
  courses.value.filter((c) => !(c.day === assign.day && c.period === assign.period))
)

function onBlockClick(c) {
  if (isAdmin.value) openEdit(c)
  else detail.value = c
}

function openAssign(d, p) {
  assign.day = d
  assign.period = p
  assign.show = true
}

async function doAssign(c) {
  const res = await updateCourseFields(c.id, { day: assign.day, period: assign.period })
  assign.show = false
  if (res.code === 0) {
    toast('《' + c.name + '》已排至 ' + weekDayName(assign.day) + ' ' + periodName(assign.period), 'success')
  }
}

function openEdit(c) {
  edit.form = { ...c }
  edit.show = true
}

async function saveEdit() {
  const f = edit.form
  if (!String(f.room || '').trim()) { toast('教室不能为空', 'error'); return }
  if (f.startWeek > f.endWeek) { toast('开始周不能大于结束周', 'error'); return }
  const res = await updateCourseFields(f.id, {
    day: f.day, period: f.period,
    startWeek: f.startWeek, endWeek: f.endWeek,
    room: String(f.room).trim(),
  })
  if (res.code === 0) edit.show = false
}

async function removeFromSchedule() {
  const f = edit.form
  const tip = f.selectedIds.length > 0
    ? '《' + f.name + '》已有 ' + f.selectedIds.length + ' 名学生选修，移出课表将同时删除该课程及其选课记录，确定吗？'
    : '确定把《' + f.name + '》移出课表吗？'
  if (!confirm(tip)) return
  const res = await removeCourse(f.id)
  if (res.code === 0) edit.show = false
}

function exportSchedule() {
  const list = visibleList.value
  const w = currentWeek.value
  const lines = [(isAdmin.value ? '课程池总览' : '我的课程表') + ' · 第 ' + w + ' 周', '========================']
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
  a.download = (isAdmin.value ? '课程池' : '课程表') + '_第' + w + '周.txt'
  a.click()
  URL.revokeObjectURL(a.href)
  toast('课表已导出', 'success')
}
</script>

<style scoped>
.week-select { width: auto; margin: 0; }
.export-btn { margin-left: auto; }
.admin-tag { font-size: 12px; color: #fff; background: #409eff; padding: 3px 10px; border-radius: 10px; }
.detail-text { font-size: 14px; line-height: 2; }
.modal-close { width: 100%; margin-top: 10px; }
.schedule-cell.editable { cursor: pointer; }
.schedule-cell.editable:hover { background: #ecf5ff; }
.cell-add { color: #dcdfe6; font-size: 18px; text-align: center; line-height: 56px; }
.assign-hint { font-size: 12px; color: #909399; margin-bottom: 10px; line-height: 1.6; }
.assign-list { max-height: 300px; overflow-y: auto; }
.assign-item { display: flex; align-items: center; gap: 8px; padding: 9px 8px;
               border-bottom: 1px solid #ebeef5; cursor: pointer; }
.assign-item:hover { background: #f5f7fa; }
.assign-name { font-size: 14px; font-weight: bold; }
.assign-meta { font-size: 12px; color: #909399; margin-left: auto; }
.color-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; flex: none; }
.row { display: flex; gap: 8px; }
.row .form-input { flex: 1; }
.grow { flex: 1; }
.edit-info { font-size: 12px; color: #909399; margin: 2px 0 10px; }
.stat-line { margin-top: 12px; font-size: 14px; }
.num-blue { color: #409eff; }
.num-green { color: #67c23a; }
</style>