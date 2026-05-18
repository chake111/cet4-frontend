import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ChoiceBlock from '../ChoiceBlock.vue'

describe('ChoiceBlock', () => {
  const questions = [
    {
      id: 'q46',
      questionNo: 46,
      content: {
        stem: 'What is the main idea of the passage?',
        options: [
          'It has a considerable impact on our health.',
          'It confines us to a 24-hour day-night cycle.',
          'It requires us to follow a particular rhythm.',
          'It holds the key to all human body functions.',
        ],
      },
    },
  ]

  it('renders the reading choice stem and keeps answer selection behavior', async () => {
    const wrapper = mount(ChoiceBlock, {
      props: {
        questions,
        answers: {},
        passage: 'All living organisms on Earth are exposed to a 24-hour day-night cycle.',
      },
    })

    expect(wrapper.text()).toContain('Q46')
    expect(wrapper.text()).toContain('What is the main idea of the passage?')
    expect(wrapper.text()).toContain('It has a considerable impact on our health.')

    await wrapper.find('.option-item').trigger('click')

    expect(wrapper.emitted('update-answer')).toEqual([[questions[0].id, 'A']])
  })
})
