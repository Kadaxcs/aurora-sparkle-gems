import { memo } from 'react';

// Virtual scrolling para listas grandes
export const VirtualList = memo(({ items, renderItem, height = 400, itemHeight = 100 }: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  height?: number;
  itemHeight?: number;
}) => {
  const visibleCount = Math.ceil(height / itemHeight);
  const startIndex = 0; // Simplified for now
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  
  return (
    <div style={{ height, overflow: 'auto' }}>
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {items.slice(startIndex, endIndex).map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              width: '100%',
              height: itemHeight,
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';