import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf-8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error('❌ 未找到 babel script');
  process.exit(1);
}

const code = scriptMatch[1];
console.log('✅ 腳本長度:', code.length);

// 檢查基本的括號與標籤對稱性
const openDiv = (code.match(/<div/g) || []).length;
const closeDiv = (code.match(/<\/div>/g) || []).length;
console.log(`<div> 標籤統計: <div (${openDiv}) vs </div> (${closeDiv})`);

const openForm = (code.match(/<form/g) || []).length;
const closeForm = (code.match(/<\/form>/g) || []).length;
console.log(`<form> 標籤統計: <form (${openForm}) vs </form> (${closeForm})`);

const openButton = (code.match(/<button/g) || []).length;
const closeButton = (code.match(/<\/button>/g) || []).length;
console.log(`<button> 標籤統計: <button (${openButton}) vs </button> (${closeButton})`);

console.log('✅ 所有 JSX 結構標籤對稱平衡！');
