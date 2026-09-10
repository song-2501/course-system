<template>
  <div class="card">
    <div class="card-title">课程池管理</div>
    <button class="btn btn-primary add-btn" @click="openForm(null)">＋ 新增课程</button>

    <table class="course-table">
      <thead>
        <tr><th>课程名</th><th>教师</th><th>时间</th><th>周次</th><th>教室</th><th>容量</th><th>已选</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="c in courses" :key="c.id">
          <td>{{ c.name }}</td>
          <td>{{ c.teacher }}</td>
          <td>{{ weekDayName(c.day) }} {{ periodName(c.period) }}</td>
          <td>{{ c.startWeek }}-{{ c.endWeek }}</td>
          <td>{{ c.room }}</td>
          <td>{{ c.capacity }}</td>
          <td><span :class="isFull(c) ? 'badge-full' : 'badge-ok'">{{ c.selectedIds.length }}</span></td>
          <td>
            <button class="btn btn-warn" @click="openForm(c)">编辑</button>
            <button class="btn btn-danger del-btn" @click="onDelete(c)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="modal.show" class="modal-mask" @click.self="modal.show = false">
      <div class="modal-box">
        <div class="card-title">{{ modal.isEdit ? '编辑课程' : '新增课程' }}</div>
        <input class="form-input" v-model="modal.form.name" placeholder="课程名称" />
        <input class="form-input" v-model="modal.form.teacher" placeholder="教师" />
        <div class="row">
          <input class="form-input" type="number" min="1" :max="TOTAL_WEEKS" v-model.number="modal.form.startWeek" placeholder="开始周" />
          <input class="form-input" type="number" min="1" :max="TOTAL_WEEKS" v-model.number="modal.form.endWeek" placeholder="结束周" />
        </div>
        <div class="row">
          <select class="form-input" v-model.number="modal.form.day">
            <option v-for="d in 7" :key="d" :value="d - 1">{{ weekDayName(d - 1) }}</option>
          </select>
          <select class="form-input" v-model.number="modal.form.period">
            <option v-for="p in 5" :key="p" :value="p - 1">{{ periodName(p - 1) }}</option>
          </select>
        </div>
        <div class="row">
          <input class="form-input" v-model="modal.form.room" placeholder="教室" />
          <input class="form-input" type="number" min="1" v-model.number="modal.form.capacity" placeholder="容量" />
          <input class="form-input" type="number" min="1" v-model.number="modal.form.credit" placeholder="学分" />
        </div>
        <div class="row color-row">
          课程颜色：<input type="color" v-model="modal.form.color" />
        </div>
        <div class="row">
          <button class="btn btn-primary grow" :disabled="submitting" @click="save">保存</button>
          <button class="btn btn-ghost grow" @click="modal.show = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { courses, submitting, toast, loadCourses } from '../store.js'
import mockApi from '../api/mockApi.js'
import { weekDayName, periodName, TOTAL_WEEKS } from '../utils.js'

const EMPTY = { id: null, name: '', teacher: '', startWeek: 1, endWeek: 16, day: 0, period: 0, room: '', capacity: 30, credit: 2, color: '#409eff' }
const modal = reactive({ show: false, isEdit: false, form: { ...EMPTY } })

const isFull = (c) => c.selectedIds.length >= c.capacity

function openForm(c) {
  modal.isEdit = !!c
  modal.form = { ...(c || EMPTY) }
  modal.show = true
}

async function save() {
  const f = modal.form
  if (!f.name.trim() || !f.teacher.trim()) { toast('课程名和教师不能为空', 'error'); return }
  if (f.startWeek > f.endWeek) { toast('开始周不能大于结束周', 'error'); return }

  submitting.value = true
  const res = modal.isEdit ? await mockApi.updateCourse({ ...f }) : await mockApi.addCourse({ ...f })
  submitting.value = false
  if (res.code === 0) {
    await loadCourses()
    modal.show = false
    toast(modal.isEdit ? '课程已更新' : '课程已添加', 'success')
  }
}

async function onDelete(c) {
  if (!confirm('确定删除《' + c.name + '》吗？已选该课的学生将被移除。')) return
  const res = await mockApi.deleteCourse(c.id)
  if (res.code === 0) {
    await loadCourses()
    toast('课程已删除', 'success')
  }
}
</script>

<style scoped>
.add-btn { margin-bottom: 12px; }
.del-btn { margin-left: 4px; }
.row { display: flex; gap: 8px; }
.row .form-input { flex: 1; }
.color-row { align-items: center; font-size: 13px; margin-bottom: 12px; }
.color-row input { width: 50px; height: 28px; border: none; cursor: pointer; }
.grow { flex: 1; }
</style>