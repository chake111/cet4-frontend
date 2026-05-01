import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  // 忽略目录
  {
    ignores: ['dist/', 'node_modules/', '.husky/'],
  },

  // ESLint 推荐规则
  js.configs.recommended,

  // Vue 3 推荐规则
  ...pluginVue.configs['flat/recommended'],

  // Prettier 兼容配置（关闭与 Prettier 冲突的规则）
  prettierConfig,

  // Prettier 插件
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },

  // 对现有代码问题仅设置 warning 级别
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/require-v-for-key': 'warn',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },

  // Vue 文件特定配置
  {
    files: ['**/*.vue'],
    rules: {
      'vue/no-unused-components': 'warn',
      'vue/valid-template-root': 'warn',
      'vue/require-default-prop': 'off',
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
]
