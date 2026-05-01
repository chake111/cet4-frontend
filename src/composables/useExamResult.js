import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { examService } from '@/services/examService'
import { formatDateTime, formatDuration } from '@/utils/date'
import {
  buildGroupedAnswers,
  buildSkillBreakdown,
  buildStageGroupedAnswers,
  buildStageSessionAnswers,
  filterWrongStageSessionAnswers,
  isObjectiveQuestion,
  sortAnswerDetails,
} from '@/domain/exam'

/**
 * 考试结果数据 composable。
 * 封装结果获取、computed 聚合链和格式化逻辑，
 * 使 ExamResultView 仅负责组合子组件渲染。
 *
 * @param {import('vue').Ref<string>} recordId - 考试记录 ID
 */
export function useExamResult(recordId) {
  const loading = ref(true)
  const result = ref(null)
  const showWrongOnly = ref(false)

  // ── 数据获取 ──
  const fetchResult = async () => {
    const id = recordId.value
    if (!id) {
      ElMessage.error('缺少考试记录 ID')
      loading.value = false
      return
    }

    loading.value = true
    try {
      const res = await examService.getExamResult(id)
      result.value = res?.data || {}
    } catch {
      ElMessage.error('获取结果失败，请稍后重试')
      result.value = {}
    } finally {
      loading.value = false
    }
  }

  // ── Computed 聚合链 ──
  const sortedAnswers = computed(() => sortAnswerDetails(result.value?.answerDetails || []))
  const groupedAnswers = computed(() => buildGroupedAnswers(sortedAnswers.value))
  const hasWrongAnswers = computed(() => {
    return groupedAnswers.value.some((group) =>
      group.questions.some(
        (question) => isObjectiveQuestion(question) && question.correct === false
      )
    )
  })

  const stageGroupedAnswers = computed(() => buildStageGroupedAnswers(sortedAnswers.value))
  const stageSessionAnswers = computed(() => buildStageSessionAnswers(stageGroupedAnswers.value))
  const stageSessionFilteredAnswers = computed(() => {
    if (!showWrongOnly.value) return stageSessionAnswers.value
    return filterWrongStageSessionAnswers(stageSessionAnswers.value)
  })

  // ── 格式化 ──
  const skillBreakdown = computed(() => buildSkillBreakdown(result.value))
  const durationText = computed(() =>
    formatDuration(result.value?.startTime, result.value?.submittedAt)
  )
  const submitTimeText = computed(() => formatDateTime(result.value?.submittedAt, '--'))
  const statusText = computed(() => {
    const score = result.value?.score
    if (score === undefined || score === null) return '--'
    return score > 0 ? '已完成' : '未作答'
  })

  return {
    loading,
    result,
    showWrongOnly,
    fetchResult,
    hasWrongAnswers,
    stageSessionFilteredAnswers,
    skillBreakdown,
    durationText,
    submitTimeText,
    statusText,
  }
}
