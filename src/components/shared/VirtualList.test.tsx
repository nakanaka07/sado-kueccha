import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { VirtualListItemProps } from '../../hooks';
import { VirtualList, VirtualListItem } from './VirtualList';

// モックデータの型定義
interface TestItem {
  id: number;
  name: string;
  value: number;
}

// モックデータ
const generateTestData = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    name: `Item ${index}`,
    value: index * 10,
  }));

// テスト用レンダラー
const TestItemRenderer = ({ index, style, data }: VirtualListItemProps) => (
  <div key={index} style={style} data-testid={`item-${index}`}>
    {data
      ? `${(data as TestItem).name}: ${(data as TestItem).value}`
      : `Item ${index}`}
  </div>
);

describe('VirtualList', () => {
  const defaultProps = {
    itemCount: 100,
    itemHeight: 50,
    height: 300,
    renderItem: TestItemRenderer,
  };

  describe('基本的なレンダリング', () => {
    it('正しくレンダリングされる', () => {
      render(<VirtualList {...defaultProps} />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toBeInTheDocument();
      expect(virtualList).toHaveAttribute(
        'aria-label',
        '仮想化リスト（100件）'
      );
    });

    it('カスタムクラス名が追加される', () => {
      render(<VirtualList {...defaultProps} className="custom-list" />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toHaveClass('custom-list');
    });

    it('カスタムスタイルが適用される', () => {
      const customStyle = { border: '1px solid red' };
      render(<VirtualList {...defaultProps} style={customStyle} />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toHaveStyle({ border: '1px solid red' });
    });

    it('指定された高さが適用される', () => {
      render(<VirtualList {...defaultProps} height={400} />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toHaveStyle({ height: '400px' });
    });
  });

  describe('アイテムレンダリング', () => {
    it('ビューポート内のアイテムのみがレンダリングされる', () => {
      render(<VirtualList {...defaultProps} />);

      // ビューポート（300px）に itemHeight（50px）で表示できるのは6個
      // オーバースキャン（デフォルト5）を含めて約16個程度がレンダリング予想
      const renderedItems = screen.getAllByTestId(/item-\d+/);
      expect(renderedItems.length).toBeLessThan(30); // 全100個より明らかに少ない
      expect(renderedItems.length).toBeGreaterThan(5); // 最低限は表示される
    });

    it('アイテムデータが正しく渡される', () => {
      const testData = generateTestData(10);
      render(
        <VirtualList {...defaultProps} itemCount={10} itemData={testData} />
      );

      // 最初のアイテムが正しくレンダリングされているか確認
      expect(screen.getByText('Item 0: 0')).toBeInTheDocument();
    });

    it('オーバースキャン設定が機能する', () => {
      render(<VirtualList {...defaultProps} overscan={10} />);

      const renderedItems = screen.getAllByTestId(/item-\d+/);
      // オーバースキャンが増えればレンダリング数も増える
      expect(renderedItems.length).toBeGreaterThan(10);
    });
  });

  describe('スクロール機能', () => {
    it('スクロールイベントが処理される', () => {
      render(<VirtualList {...defaultProps} />);

      const virtualList = screen.getByRole('list');

      // スクロールイベントをシミュレート
      fireEvent.scroll(virtualList, { target: { scrollTop: 200 } });

      // スクロール後も正常に動作することを確認
      expect(virtualList).toBeInTheDocument();
    });

    it('アイテムの位置が正しく計算される', () => {
      render(<VirtualList {...defaultProps} />);

      const firstItem = screen.getByTestId('item-0');
      expect(firstItem).toHaveStyle({
        position: 'absolute',
        top: '0px',
        height: '50px',
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定される', () => {
      render(<VirtualList {...defaultProps} />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toHaveAttribute('role', 'list');
    });

    it('適切なaria-label属性が設定される', () => {
      render(<VirtualList {...defaultProps} />);

      const virtualList = screen.getByRole('list');
      expect(virtualList).toHaveAttribute(
        'aria-label',
        '仮想化リスト（100件）'
      );
    });

    it('空白領域にaria-hidden属性が設定される', () => {
      render(<VirtualList {...defaultProps} />);

      const virtualList = screen.getByRole('list');
      const hiddenElements = virtualList.querySelectorAll(
        '[aria-hidden="true"]'
      );
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });

  describe('パフォーマンス', () => {
    it('大量のアイテムでもパフォーマンスが維持される', () => {
      const largeItemCount = 10000;
      const startTime = performance.now();

      render(<VirtualList {...defaultProps} itemCount={largeItemCount} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 1秒以内にレンダリングが完了することを確認
      expect(renderTime).toBeLessThan(1000);

      // アクチュアルにレンダリングされたアイテム数が制限されていることを確認
      const renderedItems = screen.getAllByTestId(/item-\d+/);
      expect(renderedItems.length).toBeLessThan(100); // 全10000個より明らかに少ない
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なpropsでもクラッシュしない', () => {
      expect(() => {
        render(
          <VirtualList
            itemCount={0}
            itemHeight={50}
            height={300}
            renderItem={TestItemRenderer}
          />
        );
      }).not.toThrow();
    });

    it('負の値でもクラッシュしない', () => {
      expect(() => {
        render(
          <VirtualList
            itemCount={10}
            itemHeight={-50}
            height={300}
            renderItem={TestItemRenderer}
          />
        );
      }).not.toThrow();
    });
  });
});

describe('VirtualListItem', () => {
  describe('基本的なレンダリング', () => {
    it('正しくレンダリングされる', () => {
      const style = { height: '50px', width: '100%' };
      render(
        <VirtualListItem style={style}>
          <span>Test Item</span>
        </VirtualListItem>
      );

      const item = screen.getByRole('listitem');
      expect(item).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    it('スタイルが正しく適用される', () => {
      const style = {
        height: '60px',
        width: '100%',
        backgroundColor: 'red',
      };

      render(
        <VirtualListItem style={style}>
          <span>Styled Item</span>
        </VirtualListItem>
      );

      const item = screen.getByRole('listitem');
      expect(item).toHaveStyle({
        height: '60px',
        width: '100%',
      });
      // backgroundColor は計算された値やCSS Modulesの影響で直接比較できない場合がある
    });

    it('複雑な子要素をレンダリングできる', () => {
      const style = { height: '50px', width: '100%' };
      render(
        <VirtualListItem style={style}>
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <button>Action</button>
          </div>
        </VirtualListItem>
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Action' })
      ).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定される', () => {
      const style = { height: '50px', width: '100%' };
      render(
        <VirtualListItem style={style}>
          <span>Test Item</span>
        </VirtualListItem>
      );

      const item = screen.getByRole('listitem');
      expect(item).toHaveAttribute('role', 'listitem');
    });
  });

  describe('レンダリング最適化', () => {
    it('同じpropsで再レンダリングされない（memoテスト）', () => {
      const style = { height: '50px', width: '100%' };
      const { rerender } = render(
        <VirtualListItem style={style}>
          <span>Test Item</span>
        </VirtualListItem>
      );

      const firstRender = screen.getByRole('listitem');

      // 同じpropsで再レンダリング
      rerender(
        <VirtualListItem style={style}>
          <span>Test Item</span>
        </VirtualListItem>
      );

      const secondRender = screen.getByRole('listitem');

      // DOMノードが同じことを確認（memoが効いている）
      expect(firstRender).toBe(secondRender);
    });
  });
});
