import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import pluginPrettierRecommendedConfigs from 'eslint-plugin-prettier/recommended';
import parserVue from 'vue-eslint-parser';

export default [
  {
    ignores: ['dist/*', 'public/*', '.vscode'], // 将忽略配置放在顶层
  },
  // eslint 默认推荐规则
  pluginJs.configs.recommended,
  // ts 默认推荐规则
  ...tseslint.configs.recommended,
  // vue3 基础推荐规则
  ...pluginVue.configs['flat/recommended'],
  // prettier 默认推荐规则
  pluginPrettierRecommendedConfigs,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
      },
      ecmaVersion: 2020,
      parser: parserVue,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
];
