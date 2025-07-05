import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('基本的なレンダリング', () => {
    it('デフォルト状態で正しくレンダリングされる', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('loading-spinner', 'loading-spinner--medium');
    });

    it('カスタムテストIDが設定される', () => {
      render(<LoadingSpinner testId="custom-spinner" />);

      expect(screen.getByTestId('custom-spinner')).toBeInTheDocument();
    });

    it('カスタムクラス名が追加される', () => {
      render(<LoadingSpinner className="custom-class" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('custom-class');
    });
  });

  describe('サイズバリエーション', () => {
    it('smallサイズが正しく適用される', () => {
      render(<LoadingSpinner size="small" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--small');
    });

    it('mediumサイズが正しく適用される', () => {
      render(<LoadingSpinner size="medium" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--medium');
    });

    it('largeサイズが正しく適用される', () => {
      render(<LoadingSpinner size="large" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--large');
    });
  });

  describe('メッセージ表示', () => {
    it('メッセージが表示される', () => {
      const message = 'データを読み込み中...';
      render(<LoadingSpinner message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(message)).toHaveClass('loading-spinner__message');
    });

    it('メッセージがない場合は表示されない', () => {
      const { container } = render(<LoadingSpinner />);

      const messageElement = container.querySelector(
        '.loading-spinner__message'
      );
      expect(messageElement).not.toBeInTheDocument();
    });
  });

  describe('進捗表示', () => {
    it('進捗率が表示される', () => {
      render(<LoadingSpinner progress={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('進捗率が範囲外の場合に正しく制限される', () => {
      render(<LoadingSpinner progress={150} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('負の進捗率が正しく制限される', () => {
      render(<LoadingSpinner progress={-10} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('進捗率のaria-labelが設定される', () => {
      render(<LoadingSpinner progress={50} />);

      const progressContainer = screen.getByLabelText('進捗: 50%');
      expect(progressContainer).toBeInTheDocument();
    });

    it('進捗率が未定義の場合は表示されない', () => {
      render(<LoadingSpinner />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('オーバーレイ表示', () => {
    it('オーバーレイクラスが適用される', () => {
      render(<LoadingSpinner overlay={true} />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('loading-spinner--overlay');
    });

    it('オーバーレイが無効の場合はクラスが適用されない', () => {
      render(<LoadingSpinner overlay={false} />);

      const spinner = screen.getByRole('status');
      expect(spinner).not.toHaveClass('loading-spinner--overlay');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定される', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('aria-live属性が設定される', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('デフォルトのaria-labelが設定される', () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'コンテンツを読み込み中');
    });

    it('カスタムメッセージのaria-labelが設定される', () => {
      const message = 'カスタムローディング';
      render(<LoadingSpinner message={message} />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', message);
    });

    it('スピナーアイコンのaria-hidden属性が設定される', () => {
      render(<LoadingSpinner />);

      const spinnerIcon = screen
        .getByRole('status')
        .querySelector('.loading-spinner__icon');
      expect(spinnerIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it('進捗テキストのaria-hidden属性が設定される', () => {
      render(<LoadingSpinner progress={50} />);

      const progressText = screen.getByText('50%');
      expect(progressText).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('進捗率の計算', () => {
    it('小数点の進捗率が正しく丸められる', () => {
      render(<LoadingSpinner progress={33.7} />);

      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('0%が正しく表示される', () => {
      render(<LoadingSpinner progress={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('100%が正しく表示される', () => {
      render(<LoadingSpinner progress={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('レンダリング最適化', () => {
    it('同じpropsで再レンダリングされない（memoテスト）', () => {
      const { rerender } = render(
        <LoadingSpinner message="test" size="medium" />
      );

      const firstRender = screen.getByRole('status');

      // 同じpropsで再レンダリング
      rerender(<LoadingSpinner message="test" size="medium" />);

      const secondRender = screen.getByRole('status');

      // DOMノードが同じことを確認（memoが効いている）
      expect(firstRender).toBe(secondRender);
    });
  });
});
