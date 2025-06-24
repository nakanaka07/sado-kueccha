#!/usr/bin/env node
/**
 * 設定読み込みテストスクリプト
 */

import {
  createIntegratedConfig,
  loadEnvironmentConfig,
  loadProfileConfig,
} from '../vite/config-loader.js';

async function testConfigLoader() {
  try {
    console.log('🧪 設定読み込みテスト開始');

    // 環境設定のテスト
    console.log('\n📂 環境設定読み込みテスト:');
    const environments = ['development', 'production', 'test', 'staging'];

    for (const env of environments) {
      try {
        const config = loadEnvironmentConfig(env, './config');
        console.log(`✅ ${env}: ${config.name} - ${config.description}`);
        console.log(`   ポート: ${config.vite.server.port}`);
        console.log(`   API: ${config.api.baseUrl}`);
      } catch (error) {
        console.log(
          `❌ ${env}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // プロファイル設定のテスト
    console.log('\n🎯 プロファイル設定読み込みテスト:');
    const profiles = ['minimal', 'full', 'performance'];

    for (const profile of profiles) {
      try {
        const config = loadProfileConfig(profile, './config');
        console.log(`✅ ${profile}: ${config.name} - ${config.description}`);
        console.log(
          `   最大チャンクサイズ: ${config.performance.bundleSize.maxChunkSize / 1024}KB`
        );
      } catch (error) {
        console.log(
          `❌ ${profile}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // 統合設定のテスト
    console.log('\n🔧 統合設定テスト:');
    try {
      const integratedConfig = createIntegratedConfig('development', 'minimal');
      console.log(`✅ 統合設定: ${integratedConfig.name}`);
      console.log(
        `   最適化レベル: ${integratedConfig.performance.optimizationLevel}`
      );
      console.log(
        `   機能フラグ: PWA=${integratedConfig.features.pwa}, DevTools=${integratedConfig.features.devTools}`
      );
    } catch (error) {
      console.log(
        `❌ 統合設定: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    console.log('\n🎉 設定読み込みテスト完了');
  } catch (error) {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  }
}

// テスト実行
testConfigLoader().catch(console.error);
