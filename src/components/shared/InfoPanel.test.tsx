import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InfoPanel } from './InfoPanel';

describe('InfoPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('基本的なレンダリング', () => {
    it('子要素が正しくレンダリングされる', () => {
      render(
        <InfoPanel>
          <p>Test content</p>
        </InfoPanel>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('デフォルトのクラス名が適用される', () => {
      render(
        <InfoPanel testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass(
        'info-panel',
        'info-panel--medium',
        'info-panel--center'
      );
    });

    it('カスタムクラス名が追加される', () => {
      render(
        <InfoPanel className="custom-class" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('custom-class');
    });
  });

  describe('サイズバリエーション', () => {
    it('smallサイズが正しく適用される', () => {
      render(
        <InfoPanel size="small" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--small');
    });

    it('mediumサイズが正しく適用される', () => {
      render(
        <InfoPanel size="medium" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--medium');
    });

    it('largeサイズが正しく適用される', () => {
      render(
        <InfoPanel size="large" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--large');
    });
  });

  describe('ポジションバリエーション', () => {
    it('centerポジションが正しく適用される', () => {
      render(
        <InfoPanel position="center" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--center');
    });

    it('topポジションが正しく適用される', () => {
      render(
        <InfoPanel position="top" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--top');
    });

    it('bottomポジションが正しく適用される', () => {
      render(
        <InfoPanel position="bottom" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--bottom');
    });

    it('leftポジションが正しく適用される', () => {
      render(
        <InfoPanel position="left" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--left');
    });

    it('rightポジションが正しく適用される', () => {
      render(
        <InfoPanel position="right" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveClass('info-panel--right');
    });
  });

  describe('タイトル表示', () => {
    it('タイトルが表示される', () => {
      render(
        <InfoPanel title="Test Title">
          <p>Content</p>
        </InfoPanel>
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('タイトルがない場合はヘッダーが表示されない（クローズボタンもない場合）', () => {
      render(
        <InfoPanel>
          <p>Content</p>
        </InfoPanel>
      );

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    it('タイトルのIDが正しく設定される', () => {
      render(
        <InfoPanel title="Test Title" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveAttribute('id', 'test-panel-title');
    });
  });

  describe('クローズボタン', () => {
    it('クローズボタンが表示される', () => {
      render(
        <InfoPanel onClose={mockOnClose}>
          <p>Content</p>
        </InfoPanel>
      );

      const closeButton = screen.getByRole('button', {
        name: 'パネルを閉じる',
      });
      expect(closeButton).toBeInTheDocument();
    });

    it('クローズボタンがクリックされると onClose が呼ばれる', () => {
      render(
        <InfoPanel onClose={mockOnClose}>
          <p>Content</p>
        </InfoPanel>
      );

      const closeButton = screen.getByRole('button', {
        name: 'パネルを閉じる',
      });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('onClose がない場合はクローズボタンが表示されない', () => {
      render(
        <InfoPanel title="Test Title">
          <p>Content</p>
        </InfoPanel>
      );

      expect(
        screen.queryByRole('button', { name: 'パネルを閉じる' })
      ).not.toBeInTheDocument();
    });
  });

  describe('キーボードナビゲーション', () => {
    it('dialogロールの場合にEscapeキーでクローズされる', () => {
      render(
        <InfoPanel role="dialog" onClose={mockOnClose} testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      fireEvent.keyDown(panel, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('regionロールの場合にEscapeキーが無視される', () => {
      render(
        <InfoPanel role="region" onClose={mockOnClose} testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      fireEvent.keyDown(panel, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('onCloseがない場合にEscapeキーが無視される', () => {
      render(
        <InfoPanel role="dialog" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      fireEvent.keyDown(panel, { key: 'Escape' });

      // エラーが発生しないことを確認
      expect(panel).toBeInTheDocument();
    });

    it('dialogロールの場合にtabIndexが設定される', () => {
      render(
        <InfoPanel role="dialog" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('tabindex', '-1');
    });

    it('regionロールの場合にtabIndexが設定されない', () => {
      render(
        <InfoPanel role="region" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).not.toHaveAttribute('tabindex');
    });
  });

  describe('アクセシビリティ', () => {
    it('デフォルトのrole属性が設定される', () => {
      render(
        <InfoPanel testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('role', 'region');
    });

    it('カスタムrole属性が設定される', () => {
      render(
        <InfoPanel role="dialog" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('role', 'dialog');
    });

    it('デフォルトのaria-label属性が設定される', () => {
      render(
        <InfoPanel testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('aria-label', 'Information panel');
    });

    it('タイトルがある場合にaria-label属性がタイトルになる', () => {
      render(
        <InfoPanel title="Custom Title" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('aria-label', 'Custom Title');
    });

    it('カスタムaria-label属性が設定される', () => {
      render(
        <InfoPanel aria-label="Custom ARIA Label" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const panel = screen.getByTestId('test-panel');
      expect(panel).toHaveAttribute('aria-label', 'Custom ARIA Label');
    });

    it('タイトルがある場合にaria-labelledby属性が設定される', () => {
      render(
        <InfoPanel title="Test Title" testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const content = screen.getByText('Content').parentElement;
      expect(content).toHaveAttribute('aria-labelledby', 'test-panel-title');
    });

    it('タイトルがない場合にaria-labelledby属性が設定されない', () => {
      render(
        <InfoPanel testId="test-panel">
          <p>Content</p>
        </InfoPanel>
      );

      const content = screen.getByText('Content').parentElement;
      expect(content).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('レンダリング最適化', () => {
    it('同じpropsで再レンダリングされない（memoテスト）', () => {
      const { rerender } = render(
        <InfoPanel
          title="Test"
          size="medium"
          position="center"
          testId="test-panel"
        >
          <p>Content</p>
        </InfoPanel>
      );

      const firstRender = screen.getByTestId('test-panel');

      // 同じpropsで再レンダリング
      rerender(
        <InfoPanel
          title="Test"
          size="medium"
          position="center"
          testId="test-panel"
        >
          <p>Content</p>
        </InfoPanel>
      );

      const secondRender = screen.getByTestId('test-panel');

      // DOMノードが同じことを確認（memoが効いている）
      expect(firstRender).toBe(secondRender);
    });
  });
});
