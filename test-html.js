const html = `<script>window.process = window.process || {}; window.process.env = window.process.env || {}; window.process.env.GEMINI_API_KEY = undefined;</script></head>`;
const apiKey = "RUNTIME_API_KEY";
const newHtml = html.replace(
  '</head>',
  `<script>
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.GEMINI_API_KEY = ${JSON.stringify(apiKey)};
  </script></head>`
);
console.log(newHtml);
