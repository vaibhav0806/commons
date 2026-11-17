const config = { plugins: { "@tailwindcss/postcss": {}, [process.cwd() + "/scripts/docs-css.cjs"]: {} } };
export default config;
