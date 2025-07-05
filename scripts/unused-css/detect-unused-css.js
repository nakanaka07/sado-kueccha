#!/usr/bin/env node
/**
 * 未使用CSS検出ツール
 * プロジェクト内の未使用CSSクラスを検出し、レポートを生成
 *
 * @version 1.0.0
 * @since 2025-06-30
 */

import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const CSS_FILES = [
  'src/**/*.css',
  '!src/**/*.module.css', // CSS Modulesは除外
];

const SOURCE_FILES = ['src/**/*.tsx', 'src/**/*.ts', '!src/**/*.d.ts'];

/**
 * CSSファイルからクラス名を抽出
 */
function extractCssClasses(cssContent) {
  const classRegex = /\.([a-zA-Z][\w-]*)/g;
  const classes = new Set();
  let match;

  while ((match = classRegex.exec(cssContent)) !== null) {
    classes.add(match[1]);
  }

  return classes;
}

/**
 * TypeScript/TSXファイルからクラス名の使用箇所を抽出
 */
function extractUsedClasses(sourceContent) {
  const patterns = [
    /className=['"`]([^'"`]*)['"`]/g,
    /className=\{['"`]([^'"`]*)['"`]\}/g,
    /className=\{[^}]*['"`]([^'"`]*)['"`][^}]*\}/g,
  ];

  const classes = new Set();

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(sourceContent)) !== null) {
      // スペースで分割してクラス名を個別に処理
      match[1].split(/\s+/).forEach(className => {
        if (className.trim()) {
          classes.add(className.trim());
        }
      });
    }
  });

  return classes;
}

/**
 * メイン処理
 */
async function detectUnusedCss() {
  console.log(chalk.blue('🔍 未使用CSS検出を開始...'));

  // CSSファイルの読み込み
  const cssFiles = await glob(CSS_FILES);
  const allCssClasses = new Set();
  const cssFileClasses = new Map();

  for (const file of cssFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const classes = extractCssClasses(content);
      cssFileClasses.set(file, classes);
      classes.forEach(cls => allCssClasses.add(cls));

      console.log(chalk.gray(`📄 ${file}: ${classes.size}個のクラス`));
    } catch (error) {
      console.error(chalk.red(`❌ ${file} の読み込みエラー:`, error.message));
    }
  }

  // ソースファイルの読み込み
  const sourceFiles = await glob(SOURCE_FILES);
  const allUsedClasses = new Set();

  for (const file of sourceFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const classes = extractUsedClasses(content);
      classes.forEach(cls => allUsedClasses.add(cls));
    } catch (error) {
      console.error(chalk.red(`❌ ${file} の読み込みエラー:`, error.message));
    }
  }

  // 未使用クラスの検出
  const unusedClasses = new Set();
  const fileUnusedClasses = new Map();

  for (const [file, classes] of cssFileClasses) {
    const fileUnused = new Set();
    classes.forEach(cls => {
      if (!allUsedClasses.has(cls)) {
        unusedClasses.add(cls);
        fileUnused.add(cls);
      }
    });
    fileUnusedClasses.set(file, fileUnused);
  }

  // レポート生成
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalCssClasses: allCssClasses.size,
      totalUsedClasses: allUsedClasses.size,
      totalUnusedClasses: unusedClasses.size,
      unusageRate: Math.round((unusedClasses.size / allCssClasses.size) * 100),
    },
    files: Object.fromEntries(
      Array.from(fileUnusedClasses.entries()).map(([file, unused]) => [
        file,
        {
          totalClasses: cssFileClasses.get(file).size,
          unusedClasses: Array.from(unused),
          unusedCount: unused.size,
        },
      ])
    ),
    unusedClasses: Array.from(unusedClasses).sort(),
  };

  // レポート出力
  writeFileSync(
    'scripts/unused-css/report.json',
    JSON.stringify(report, null, 2)
  );

  // コンソール出力
  console.log('\n' + chalk.green('✅ 検出完了'));
  console.log(chalk.blue('📊 結果サマリー:'));
  console.log(
    `   総CSSクラス数: ${chalk.yellow(report.summary.totalCssClasses)}`
  );
  console.log(
    `   使用中クラス数: ${chalk.green(report.summary.totalUsedClasses)}`
  );
  console.log(
    `   未使用クラス数: ${chalk.red(report.summary.totalUnusedClasses)}`
  );
  console.log(`   未使用率: ${chalk.red(report.summary.unusageRate)}%`);

  if (report.summary.totalUnusedClasses > 0) {
    console.log('\n' + chalk.yellow('⚠️  未使用クラス（一部）:'));
    report.unusedClasses.slice(0, 10).forEach(cls => {
      console.log(`   ${chalk.red('•')} ${cls}`);
    });

    if (report.unusedClasses.length > 10) {
      console.log(
        `   ${chalk.gray('... 他')} ${report.unusedClasses.length - 10} ${chalk.gray('個')}`
      );
    }
  }

  console.log(
    `\n📄 詳細レポート: ${chalk.cyan('scripts/unused-css/report.json')}`
  );

  return report;
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  detectUnusedCss().catch(console.error);
}

export { detectUnusedCss };
