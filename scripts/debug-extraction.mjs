/**
 * Debug script: Analyze medicament.ma page structure
 * This fetches a page and logs what data can be extracted using only regex
 */

const TEST_URL = 'https://medicament.ma/medicament/actifed-comprime/';

async function analyzePageStructure() {
  try {
    console.log(`Fetching: ${TEST_URL}\n`);
    
    const response = await fetch(TEST_URL);
    const html = await response.text();
    
    console.log('=== Page Analysis ===\n');
    
    // Check for JSON-LD
    const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    if (jsonLdMatches.length > 0) {
      console.log(`Found ${jsonLdMatches.length} JSON-LD script(s):`);
      jsonLdMatches.forEach((match, i) => {
        try {
          const data = JSON.parse(match[1]);
          console.log(`  Script ${i+1}:`, JSON.stringify(data, null, 2).slice(0, 800));
        } catch (e) {
          console.log(`  Script ${i+1}: Parse error -`, e.message);
        }
      });
      console.log('\n');
    } else {
      console.log('No JSON-LD found\n');
    }
    
    // Look for meta tags
    const metaMatches = [
      ...html.matchAll(/<meta\s+property=["']og:([^"']+)["'][^>]+content=["']([^"']+)["']/gi),
      ...html.matchAll(/<meta\s+name=["'](description|keywords)["'][^>]+content=["']([^"']+)["']/gi),
    ];
    
    if (metaMatches.length > 0) {
      console.log('Meta tags found:');
      metaMatches.slice(0, 10).forEach(match => {
        console.log(`  ${match[1]}: ${match[2]?.slice(0, 80)}`);
      });
      console.log('\n');
    }
    
    // Look for common selectors
    console.log('Searching for common elements:');
    
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      const text = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`  h1: ${text.slice(0, 100)}`);
    }
    
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      console.log(`  title: ${titleMatch[1].slice(0, 100)}`);
    }
    
    // Look for table content (common for product specs)
    const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];
    console.log(`  tables found: ${tableMatches.length}`);
    if (tableMatches.length > 0) {
      const firstTable = tableMatches[0][1];
      const cells = [...firstTable.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)];
      console.log(`    First table cells (${cells.length}):`);
      cells.slice(0, 8).forEach((cell, i) => {
        const text = cell[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`      ${i}: ${text.slice(0, 60)}`);
      });
    }
    
    // Look for divs with class attributes that might contain product info
    const divMatches = [...html.matchAll(/<div[^>]+class=["']([^"']*product[^"']*)["'][^>]*>([\s\S]*?)<\/div>/gi)];
    if (divMatches.length > 0) {
      console.log(`  product divs found: ${divMatches.length}`);
      divMatches.slice(0, 3).forEach((match, i) => {
        const className = match[1];
        const content = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`    Class: ${className}`);
        console.log(`    Content: ${content.slice(0, 80)}`);
      });
    }
    
    // Look for common label patterns (Laboratoires, Dosage, etc.)
    console.log('\n=== Searching for pharmaceutical labels ===');
    const labels = ['Laboratoires?', 'Dosage', 'DCI', 'Forme', 'Indications?', 'Posologie', 'Contre-indications?'];
    labels.forEach(label => {
      const regex = new RegExp(`${label}[:\\s]*([^<]{0,150})<`, 'gi');
      const match = html.match(regex);
      if (match) {
        console.log(`  ${label}: Found`);
        console.log(`    ${match[0].slice(0, 100)}`);
      }
    });
    
    console.log('\n=== HTML Structure Preview (first 3000 chars after <body>) ===\n');
    const bodyStart = html.indexOf('<body');
    if (bodyStart >= 0) {
      const bodyContent = html.substring(bodyStart, bodyStart + 3000);
      console.log(bodyContent);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzePageStructure();
