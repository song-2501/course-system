import { ref, shallowRef, computed } from 'vue'
import mockApi from './api/mockApi.js'

export const currentUser = ref(mockApi.getCurrentUser())
export const courses = shallowRef([])
export const submitting = ref(false)

export const toasts = ref([])
let toastId = 0
export function toast(msg, type = 'info') {
  const id = ++toastId
  toasts.value.push({ id, msg, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 2500)
}

export const myCourses = computed(() => {
  if (!currentUser.value) return []
  const uid = currentUser.value.id
  return courses.value.filter((c) => c.selectedIds.indexOf(uid) >= 0)
})

export const totalCredit = computed(() =>
  myCourses.value.reduce((sum, c) => sum + c.credit, 0)
)

export async function loadCourses() {
  const res = await mockApi.getCourses()
  courses.value = res.data
}

export async function login(userId, password) {
  const res = await mockApi.login(userId, password)
  if (res.code === 0) {
    currentUser.value = res.data
    await loadCourses()
  }
  return res
}

export async function logout() {
  await mockApi.logout()
  currentUser.value = null
  courses.value = []
}

export async function selectCourse(course) {
  submitting.value = true
  const res = await mockApi.selectCourse(course.id, currentUser.value.id)
  submitting.value = false
  await loadCourses()
  toast(res.msg, res.code === 0 ? 'success' : 'error')
  return res
}

export async function updateCourseFields(id, fields) {
  submitting.value = true
  const res = await mockApi.updateCourseFields(id, fields)
  submitting.value = false
  await loadCourses()
  toast(res.msg, res.code === 0 ? 'success' : 'error')
  return res
}

export async function removeCourse(id) {
  submitting.value = true
  const res = await mockApi.deleteCourse(id)
  submitting.value = false
  await loadCourses()
  toast('课程已从课表移除', res.code === 0 ? 'success' : 'error')
  return res
}

export async function dropCourse(course) {
  submitting.value = true
  const res = await mockApi.dropCourse(course.id, currentUser.value.id)
  submitting.value = false
  await loadCourses()
  toast(res.msg, res.code === 0 ? 'success' : 'error')
  return res
}

if (currentUser.value) loadCourses()