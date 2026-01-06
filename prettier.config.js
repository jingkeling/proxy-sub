/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const prettierConfig = {
  printWidth: 120, // 每行代码长度（默认80）
  tabWidth: 2, // 每个tab相当于多少个空格（默认2）ab进行缩进（默认false）
  useTabs: false, // 是否使用tab进行缩进
  singleQuote: true, // 使用单引号（默认false）
  semi: false, // 声明结尾使用分号(默认true)
  trailingComma: 'all', // 多行使用拖尾逗号（默认none）
  racketSpacing: false, // 对象字面量的大括号间使用空格（默认true）
  jsxBracketSameLine: true, // 多行JSX中的>放置在最后一行的结尾，而不是另起一行（默认false）
  bracketSameLine: true,
  arrowParens: 'always', //默认avoid，箭头函数省略括号；always总是有括号
  bracketSpacing: true,
  plugins: ['prettier-plugin-tailwindcss'],
}
export default prettierConfig
