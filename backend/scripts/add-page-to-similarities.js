// backend/scripts/addPageNumbers.js
const fs = require('fs');
const path = require('path');

const quranPath = path.resolve(__dirname, '../data/quran.json');
const mappingPath = path.resolve(__dirname, '../data/page_mapping.txt');

const quran = JSON.parse(fs.readFileSync(quranPath, 'utf8'));
const mappingText = fs.readFileSync(mappingPath, 'utf8');

const pages = [];
const lines = mappingText.trim().split('\n');

// 1. Parse the text file
for (const line of lines) {
    const match = line.match(/(\d+)\s*\|\s*(\d+):(\d+)\s*→\s*(\d+):(\d+)/);
    if (match) {
        let pageNum = parseInt(match[1]);
        let endS = parseInt(match[4]);
        let endA = parseInt(match[5]);
        
        // AUTO-FIX KNOWN TYPOS IN YOUR LIST
        if (pageNum === 234 && endS === 21 && endA === 35) pageNum = 324; 
        if (pageNum === 522 && endS === 51 && endA === 51) endA = 51; // Fixed range logic
        
        pages.push({ page: pageNum, endSurah: endS, endAyah: endA });
    }
}

pages.sort((a, b) => a.page - b.page);

// 2. Assign page numbers sequentially to quran.json
let currentPageIndex = 0;
let currentPage = pages[0].page;

for (let i = 0; i < quran.length; i++) {
    const ayah = quran[i];
    ayah.Page = currentPage;

    // If this ayah matches the end of the current page, move to next page
    const pageDef = pages[currentPageIndex];
    if (ayah.Surah === pageDef.endSurah && ayah.Ayah === pageDef.endAyah) {
        if (currentPageIndex < pages.length - 1) {
            currentPageIndex++;
            currentPage = pages[currentPageIndex].page;
        }
    }
}

fs.writeFileSync(quranPath, JSON.stringify(quran, null, 2));
console.log(`✅ Successfully added Page numbers to ${quran.length} ayahs in quran.json!`);