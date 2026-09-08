import { weekDayName, periodName } from '../utils.js'

const COURSE_KEY = 'cs_courses'
const USER_KEY = 'cs_user'

const USERS = [
  { id: '2021001', password: '123456', name: '李明', role: 'student' },
  { id: '2021002', password: '123456', name: '王芳', role: 'student' },
  { id: 'admin', password: 'admin123', name: '教务处管理员', role: 'admin' }
]

function delay(result, ms = 250) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(result))), ms)
  })
}

function saveCourses(list) {
  localStorage.setItem(COURSE_KEY, JSON.stringify(list))
}

function seedCourses() {
  const list = [
    { id: 1, name: '前端开发技术', teacher: '张老师', startWeek: 1, endWeek: 16, day: 0, period: 0, room: 'A101', capacity: 60, selectedIds: [], credit: 4, color: '#409eff' },
    { id: 2, name: '数据结构', teacher: '李老师', startWeek: 1, endWeek: 16, day: 1, period: 1, room: 'B203', capacity: 2, selectedIds: [], credit: 3, color: '#67c23a' },
    { id: 3, name: '操作系统', teacher: '王老师', startWeek: 1, endWeek: 12, day: 0, period: 0, room: 'C305', capacity: 40, selectedIds: [], credit: 3, color: '#e6a23c' },
    { id: 4, name: '大学英语', teacher: '赵老师', startWeek: 1, endWeek: 16, day: 2, period: 2, room: 'A201', capacity: 30, selectedIds: [], credit: 2, color: '#f56c6c' },
    { id: 5, name: '体育（篮球）', teacher: '刘老师', startWeek: 3, endWeek: 16, day: 4, period: 3, room: '体育馆', capacity: 25, selectedIds: [], credit: 1, color: '#909399' },
    { id: 6, name: '人工智能导论', teacher: '陈老师', startWeek: 1, endWeek: 8, day: 3, period: 4, room: 'D102', capacity: 50, selectedIds: [], credit: 2, color: '#409eff' }
  ]
  saveCourses(list)
  return list
}

function loadCourses() {
  try {
    const raw = localStorage.getItem(COURSE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return seedCourses()
}

function isConflict(a, b) {
  if (a.day !== b.day || a.period !== b.period) return false
  return !(a.endWeek < b.startWeek || a.startWeek > b.endWeek)
}

export default {
  login(userId, password) {
    const hit = USERS.find((u) => u.id === userId && u.password === password)
    if (!hit) return delay({ code: 1, msg: '账号或密码错误' }, 400)
    const user = { id: hit.id, name: hit.name, role: hit.role }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    return delay({ code: 0, data: user }, 400)
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) { return null }
  },

  logout() {
    localStorage.removeItem(USER_KEY)
    return delay({ code: 0 }, 100)
  },

  getCourses() {
    return delay({ code: 0, data: loadCourses() })
  },

  addCourse(course) {
    const list = loadCourses()
    course.id = Date.now()
    course.selectedIds = []
    list.push(course)
    saveCourses(list)
    return delay({ code: 0, data: list })
  },

  updateCourse(course) {
    const list = loadCourses()
    const i = list.findIndex((c) => c.id === course.id)
    if (i >= 0) {
      course.selectedIds = list[i].selectedIds
      list[i] = course
      saveCourses(list)
    }
    return delay({ code: 0, data: list })
  },

  deleteCourse(id) {
    const list = loadCourses()
    const newList = list.filter((c) => c.id !== id)
    saveCourses(newList)
    return delay({ code: 0, data: newList })
  },

  selectCourse(courseId, studentId) {
    const list = loadCourses()
    const target = list.find((c) => c.id === courseId)
    if (!target) return delay({ code: 1, msg: '课程不存在' })
    if (target.selectedIds.indexOf(studentId) >= 0)
      return delay({ code: 1, msg: '你已经选过这门课了' })
    if (target.selectedIds.length >= target.capacity)
      return delay({ code: 1, msg: '《' + target.name + '》人数已满，无法选择' })
    for (const c of list) {
      if (c.id !== courseId && c.selectedIds.indexOf(studentId) >= 0 && isConflict(target, c)) {
        return delay({ code: 1, msg: '时间冲突！与已选课程《' + c.name + '》（' + weekDayName(c.day) + ' ' + periodName(c.period) + '）冲突' })
      }
    }
    target.selectedIds.push(studentId)
    saveCourses(list)
    return delay({ code: 0, data: list, msg: '选课成功：' + target.name })
  },

  dropCourse(courseId, studentId) {
    const list = loadCourses()
    const target = list.find((c) => c.id === courseId)
    if (target) {
      const idx = target.selectedIds.indexOf(studentId)
      if (idx >= 0) target.selectedIds.splice(idx, 1)
      saveCourses(list)
    }
    return delay({ code: 0, data: list, msg: '退课成功' })
  }
}