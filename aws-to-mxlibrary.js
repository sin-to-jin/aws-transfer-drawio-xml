#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const pako = require('pako');

// コマンドライン引数処理
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: ./aws-to-mxlibrary.js <SVG patterns...> -o <output file>');
  process.exit(1);
}

let outputFile = 'aws-icons.mxlibrary';
const svgPatterns = [];

// 引数を解析
args.forEach((arg, index) => {
  if (arg === '-o' && args[index + 1]) {
    outputFile = args[index + 1];
  } else if (!arg.startsWith('-')) {
    svgPatterns.push(arg);
  }
});

if (svgPatterns.length === 0) {
  console.error('No SVG file patterns provided.');
  process.exit(1);
}

// SVGファイルを検索
let svgFiles = [];
svgPatterns.forEach((pattern) => {
  svgFiles = svgFiles.concat(glob.sync(pattern, { nodir: true }));
});

svgFiles = [...new Set(svgFiles)]; // 重複を除去

if (svgFiles.length === 0) {
  console.error('No SVG files found for the provided patterns.');
  process.exit(1);
}

console.log(`Found ${svgFiles.length} SVG files. Processing...`);

// アイコンライブラリの作成
const library = svgFiles.map((filePath) => {
  const title = path.basename(filePath, '.svg')
    .replace(/-/g, ' ')
    .replace(/^AWS\s*/, 'AWS ')
    .replace(/\s+/g, ' ');

  const svgContent = fs.readFileSync(filePath, 'utf8');
  const image = 'data:image/svg+xml,' + Buffer.from(svgContent).toString('base64');

  const xmlTemplate = `
    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="2" value="" style="shape=image;verticalLabelPosition=bottom;verticalAlign=top;imageAspect=1;aspect=fixed;image=${image}" vertex="1" parent="1">
          <mxGeometry x="0" y="0" width="80" height="80" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  `;

  const compressedXml = Buffer.from(pako.deflateRaw(encodeURIComponent(xmlTemplate))).toString('base64');

  return { title, xml: compressedXml, w: 80, h: 80 };
});

// ライブラリファイルを出力
fs.writeFileSync(outputFile, `<mxlibrary>${JSON.stringify(library)}</mxlibrary>`);
console.log(`Library successfully generated: ${outputFile}`);

