#!/usr/bin/env node

/**
 * Component Migration Analyzer
 * Identifies components that need responsive updates
 * 
 * Usage: node analyze-components.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COMPONENTS_DIR = path.join(__dirname, 'src/components');
const IGNORE_DIRS = ['ui', 'layout', 'examples', 'Ui', 'Auths', 'Device detail', 'Home', 'News', 'Product', 'Static'];
const PATTERNS = {
  inlineStyles: /style=\{\{/g,
  divWrappers: /<div style=\{/g,
  gridWithoutResponsive: /gridTemplateColumns|grid-cols-\d+/g,
  notResponsive: /display: 'flex'|display: 'grid'|display: 'block'/g,
};

class ComponentAnalyzer {
  constructor() {
    this.results = {
      responsive: [],
      needsMigration: [],
      partial: [],
      total: 0,
    };
  }

  analyze() {
    console.log('🔍 Analyzing components for responsive design...\n');
    this.scanDirectory(COMPONENTS_DIR);
    this.printReport();
  }

  scanDirectory(dir) {
    try {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!IGNORE_DIRS.includes(file)) {
            this.scanDirectory(fullPath);
          }
        } else if (file.endsWith('.jsx')) {
          this.analyzeFile(fullPath);
        }
      });
    } catch (err) {
      console.error(`Error scanning directory ${dir}:`, err.message);
    }
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relPath = path.relative(COMPONENTS_DIR, filePath);

      this.results.total++;

      const analysis = this.analyzeContent(content);

      if (analysis.status === 'responsive') {
        this.results.responsive.push(relPath);
      } else if (analysis.status === 'partial') {
        this.results.partial.push({ path: relPath, issues: analysis.issues });
      } else {
        this.results.needsMigration.push({ path: relPath, issues: analysis.issues });
      }
    } catch (err) {
      console.error(`Error analyzing ${filePath}:`, err.message);
    }
  }

  analyzeContent(content) {
    const issues = [];

    if (PATTERNS.inlineStyles.test(content)) {
      issues.push('Uses inline styles (style={{}})');
    }

    if (PATTERNS.gridWithoutResponsive.test(content)) {
      issues.push('Uses non-responsive grid layout');
    }

    if (PATTERNS.notResponsive.test(content)) {
      issues.push('Uses hardcoded display values');
    }

    if (!/ResponsiveGrid|ResponsiveContainer|ResponsivePageWrapper/.test(content)) {
      if (issues.length > 0) {
        return { status: 'needsMigration', issues };
      }
    }

    if (issues.length === 0) {
      return { status: 'responsive', issues: [] };
    }

    return { status: 'partial', issues };
  }

  printReport() {
    const { responsive, partial, needsMigration, total } = this.results;

    console.log('═'.repeat(60));
    console.log('📊 COMPONENT MIGRATION ANALYSIS REPORT');
    console.log('═'.repeat(60));
    console.log(`Total Components: ${total}\n`);

    // Summary
    const percentComplete = Math.round((responsive.length / total) * 100);
    console.log(`✅ Responsive (${responsive.length}): ${percentComplete}% complete`);
    console.log(`⚠️  Partial (${partial.length}): Need review`);
    console.log(`❌ Needs Migration (${needsMigration.length}): High priority\n`);

    // Responsive components
    if (responsive.length > 0) {
      console.log('✅ ALREADY RESPONSIVE:');
      responsive.slice(0, 5).forEach(comp => console.log(`   • ${comp}`));
      if (responsive.length > 5) console.log(`   ... and ${responsive.length - 5} more`);
      console.log();
    }

    // Partial
    if (partial.length > 0) {
      console.log('⚠️  PARTIAL MIGRATION NEEDED:');
      partial.slice(0, 5).forEach(({ path, issues }) => {
        console.log(`   • ${path}`);
        issues.forEach(issue => console.log(`     - ${issue}`));
      });
      if (partial.length > 5) console.log(`   ... and ${partial.length - 5} more`);
      console.log();
    }

    // Needs migration
    if (needsMigration.length > 0) {
      console.log('❌ HIGH PRIORITY (NEEDS MIGRATION):');
      needsMigration.slice(0, 10).forEach(({ path, issues }) => {
        console.log(`   • ${path}`);
        issues.forEach(issue => console.log(`     - ${issue}`));
      });
      if (needsMigration.length > 10) console.log(`   ... and ${needsMigration.length - 10} more`);
      console.log();
    }

    // Next steps
    console.log('═'.repeat(60));
    console.log('📋 NEXT STEPS:');
    console.log('═'.repeat(60));
    console.log(`1. Start with top ${Math.min(5, needsMigration.length)} components from HIGH PRIORITY list`);
    console.log('2. Use ResponsivePageWrapper to wrap existing components');
    console.log('3. Replace inline styles with Tailwind classes');
    console.log('4. Replace divs with responsive layout components');
    console.log('5. Test on mobile (DevTools → Device Toolbar)\n');
    console.log('📚 Reference: See COMPONENT_MIGRATION_GUIDE.md for detailed examples\n');
  }
}

// Run analyzer
const analyzer = new ComponentAnalyzer();
analyzer.analyze();
