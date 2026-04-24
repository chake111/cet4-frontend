<template>
  <div>
    <h2>WritingStage 测试</h2>
    <WritingStage :questions="writingMock" />

    <h2>ListeningStage 测试</h2>
    <ListeningStage :questions="listeningMock" />

    <h2>ReadingStage 测试</h2>
    <ReadingStage :questions="readingMock" />

    <h2>TranslationStage 测试</h2>
    <TranslationStage :questions="translationMock" />
  </div>
</template>

<script>
import WritingStage from '@/components/exam/stages/WritingStage.vue';
import ListeningStage from '@/components/exam/stages/ListeningStage.vue';
import ReadingStage from '@/components/exam/stages/ReadingStage.vue';
import TranslationStage from '@/components/exam/stages/TranslationStage.vue';

export default {
  name: 'TestStages',
  components: {
    WritingStage,
    ListeningStage,
    ReadingStage,
    TranslationStage,
  },
  data() {
    return {
      writingMock: [
        { id: 'w1', content: { title: '请就环境保护写一篇作文' } }
      ],
      listeningMock: [
        { id: 'l1', content: { stem: 'What does the man mean?', options: ['A. Yes', 'B. No', 'C. Maybe', 'D. Unknown'] } }
      ],
      readingMock: [
        { id: 'r1', content: { passage: 'This is a passage.', stem: 'What is the main idea?', options: ['A.', 'B.', 'C.', 'D.'] } }
      ],
      translationMock: [
        { id: 't1', content: { source: '中国是一个历史悠久的国家。' } }
      ]
    };
  }
};
</script>

<style scoped>
h2 {
  margin-top: 32px;
  color: #333;
}
</style>
