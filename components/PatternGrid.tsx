import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { idx } from '@/lib/grid';
import type { Project } from '@/lib/types';

type Mode = 'design' | 'track';

type PatternGridProps = {
  project: Project;
  mode: Mode;
  cellSize?: number;
  showIncompleteOnly?: boolean;
  onCellPress: (x: number, y: number) => void;
};

type RowProps = {
  y: number;
  width: number;
  cellSize: number;
  mode: Mode;
  design: number[];
  stitched: boolean[];
  palette: Project['palette'];
  showIncompleteOnly: boolean;
  onPress: (x: number, y: number) => void;
};

const GridRow = memo(function GridRow({
  y,
  width,
  cellSize,
  mode,
  design,
  stitched,
  palette,
  showIncompleteOnly,
  onPress,
}: RowProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: width }, (_, x) => {
        const cellIndex = idx(x, y, width);
        const c = design[cellIndex];
        const done = stitched[cellIndex];
        const swatch = c >= 0 ? palette[c] : null;
        const fill = swatch?.hex ?? '#ECECEC';
        const isEmpty = c < 0;
        const dimCompleted = mode === 'track' && showIncompleteOnly && done && !isEmpty;
        return (
          <Pressable
            key={cellIndex}
            onPress={() => onPress(x, y)}
            style={({ pressed }) => [
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: fill,
                opacity: dimCompleted ? 0.22 : pressed ? 0.85 : 1,
                borderColor: isEmpty ? '#D8D8D8' : done && mode === 'track' ? '#1a7f37' : '#BDBDBD',
                borderWidth: done && mode === 'track' && !isEmpty ? 1.5 : StyleSheet.hairlineWidth,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

export function PatternGrid({
  project,
  mode,
  cellSize = 14,
  showIncompleteOnly = false,
  onCellPress,
}: PatternGridProps) {
  const { width, height, design, palette, stitched } = project;
  const [viewportH, setViewportH] = useState(320);

  const rowIndices = useMemo(() => Array.from({ length: height }, (_, i) => i), [height]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setViewportH(h);
  }, []);

  const renderRow = useCallback(
    ({ item: y }: { item: number }) => (
      <GridRow
        y={y}
        width={width}
        cellSize={cellSize}
        mode={mode}
        design={design}
        stitched={stitched}
        palette={palette}
        showIncompleteOnly={showIncompleteOnly}
        onPress={onCellPress}
      />
    ),
    [cellSize, design, height, mode, onCellPress, palette, showIncompleteOnly, stitched, width],
  );

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
        <FlatList
          data={rowIndices}
          keyExtractor={(y) => String(y)}
          renderItem={renderRow}
          getItemLayout={(_, index) => ({
            length: cellSize,
            offset: cellSize * index,
            index,
          })}
          initialNumToRender={28}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          style={{ width: width * cellSize, height: viewportH }}
          nestedScrollEnabled
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  row: { flexDirection: 'row' },
  cell: {},
});
