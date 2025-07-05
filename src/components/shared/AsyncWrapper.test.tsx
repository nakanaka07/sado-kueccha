import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AsyncWrapper } from './AsyncWrapper';

interface TestData {
  id: string;
  name: string;
}

/* eslint-disable react/no-children-prop */
describe('AsyncWrapper', () => {
  const mockData: TestData = { id: '1', name: 'Test Data' };
  const mockChildren = vi.fn((data: TestData) => <div>{data.name}</div>);
  const mockRetryFn = vi.fn();

  beforeEach(() => {
    mockChildren.mockClear();
    mockRetryFn.mockClear();
  });

  describe('ローディング状態', () => {
    it('ローディング状態を正しく表示する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={true}
          error={null}
          children={mockChildren}
        />
      );

      expect(screen.getByTestId('async-wrapper-loading')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      // LoadingSpinnerにはaria-labelで「コンテンツを読み込み中」が設定されている
      expect(
        screen.getByLabelText('コンテンツを読み込み中')
      ).toBeInTheDocument();
    });

    it('カスタムローディングメッセージを表示する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={true}
          error={null}
          children={mockChildren}
          loadingMessage="カスタムローディング"
        />
      );

      expect(screen.getByText('カスタムローディング')).toBeInTheDocument();
    });

    it('カスタムローディングコンポーネントを表示する', () => {
      const CustomLoading = () => <div>Custom Loading Component</div>;

      render(
        <AsyncWrapper
          data={null}
          loading={true}
          error={null}
          children={mockChildren}
          loadingComponent={<CustomLoading />}
        />
      );

      expect(screen.getByText('Custom Loading Component')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー状態を正しく表示する', () => {
      const errorMessage = 'テストエラー';

      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error={new Error(errorMessage)}
          children={mockChildren}
        />
      );

      expect(screen.getByTestId('async-wrapper-error')).toBeInTheDocument();
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('文字列エラーを正しく表示する', () => {
      const errorMessage = 'エラー文字列';

      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error={errorMessage}
          children={mockChildren}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('リトライボタンが正しく動作する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error="エラー"
          children={mockChildren}
          retryFn={mockRetryFn}
        />
      );

      const retryButton = screen.getByRole('button', { name: '再試行' });
      fireEvent.click(retryButton);

      expect(mockRetryFn).toHaveBeenCalledTimes(1);
    });

    it('カスタムリトライテキストを表示する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error="エラー"
          children={mockChildren}
          retryFn={mockRetryFn}
          retryText="もう一度試す"
        />
      );

      expect(
        screen.getByRole('button', { name: 'もう一度試す' })
      ).toBeInTheDocument();
    });

    it('カスタムエラーコンポーネントを表示する', () => {
      const CustomError = (error: Error | string) => (
        <div>
          Custom Error: {typeof error === 'string' ? error : error.message}
        </div>
      );

      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error="カスタムエラー"
          children={mockChildren}
          errorComponent={CustomError}
        />
      );

      expect(
        screen.getByText('Custom Error: カスタムエラー')
      ).toBeInTheDocument();
    });
  });

  describe('空状態', () => {
    it('空状態を正しく表示する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error={null}
          children={mockChildren}
        />
      );

      expect(screen.getByTestId('async-wrapper-empty')).toBeInTheDocument();
      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('カスタム空状態メッセージを表示する', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error={null}
          children={mockChildren}
          emptyMessage="カスタム空状態"
        />
      );

      expect(screen.getByText('カスタム空状態')).toBeInTheDocument();
    });

    it('カスタム空状態コンポーネントを表示する', () => {
      const CustomEmpty = () => <div>Custom Empty Component</div>;

      render(
        <AsyncWrapper
          data={null}
          loading={false}
          error={null}
          children={mockChildren}
          emptyComponent={<CustomEmpty />}
        />
      );

      expect(screen.getByText('Custom Empty Component')).toBeInTheDocument();
    });
  });

  describe('成功状態', () => {
    it('データが存在する場合に子コンポーネントを表示する', () => {
      render(
        <AsyncWrapper
          data={mockData}
          loading={false}
          error={null}
          children={mockChildren}
        />
      );

      expect(screen.getByTestId('async-wrapper-success')).toBeInTheDocument();
      expect(screen.getByText('Test Data')).toBeInTheDocument();
      expect(mockChildren).toHaveBeenCalledWith(mockData);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なテストIDが設定される', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={true}
          error={null}
          children={mockChildren}
          testId="custom-wrapper"
        />
      );

      expect(screen.getByTestId('custom-wrapper-loading')).toBeInTheDocument();
    });

    it('ローディング状態でaria-labelが設定される', () => {
      render(
        <AsyncWrapper
          data={null}
          loading={true}
          error={null}
          children={mockChildren}
        />
      );

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toHaveAttribute(
        'aria-label',
        'コンテンツを読み込み中'
      );
    });
  });

  describe('型安全性', () => {
    it('Genericsが正しく動作する', () => {
      interface CustomData {
        value: number;
      }

      const customData: CustomData = { value: 42 };
      const customChildren = vi.fn((data: CustomData) => (
        <div>{data.value}</div>
      ));

      render(
        <AsyncWrapper<CustomData>
          data={customData}
          loading={false}
          error={null}
          children={customChildren}
        />
      );

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(customChildren).toHaveBeenCalledWith(customData);
    });
  });
});
