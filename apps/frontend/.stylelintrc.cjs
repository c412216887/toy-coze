module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-standard-vue',
    'stylelint-config-recess-order'
  ],
  overrides: [
    {
      files: ['**/*.{scss,css,vue,html}'],
      customSyntax: 'postcss-scss'
    },
    {
      files: ['**/*.{html,vue}'],
      customSyntax: 'postcss-html'
    }
  ],
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.tsx', '**/*.ts', '**/*.json', '**/*.md'],
  rules: {
    'value-keyword-case': null,
    'no-descending-specificity': null,
    'function-url-quotes': 'always',
    'no-empty-source': null,
    'selector-class-pattern': null,
    'property-no-unknown': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global', 'v-deep', 'deep'] }]
  }
}
