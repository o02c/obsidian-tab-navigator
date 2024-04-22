const preprocess = require('svelte-preprocess');

module.exports = {
  preprocess: preprocess({
    typescript: true,
    scss: {
      additionalData: `@import 'src/styles/variables.scss';` // グローバルに使用したい変数やミックスインを指定
    },
  }),
};