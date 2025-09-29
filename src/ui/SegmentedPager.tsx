import React, { useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
  FlatList,
  FlatListProps,
} from "react-native";

type KeyFn<T> = (item: T, index: number) => string;

export type SegmentedPagerProps<T> = {
  items: ReadonlyArray<T>;
  index: number;
  onIndexChange: (next: number) => void;

  /** Animated.Value externo para las pills */
  scrollX: Animated.Value;

  renderPage: (item: T, index: number) => React.ReactNode;
  getKey?: KeyFn<T>;
  width?: number;
  style?: StyleProp<ViewStyle>;
};

/** Animated FlatList tipado con genéricos + ref seguro */
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList) as unknown as
  <T>(props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> }) => React.ReactElement;

function SegmentedPager<T>({
  items,
  index,
  onIndexChange,
  scrollX,
  renderPage,
  getKey,
  width,
  style,
}: SegmentedPagerProps<T>) {
  const { width: SCREEN_WIDTH } = Dimensions.get("window");
  const PAGE_W = width ?? SCREEN_WIDTH;

  // ref del FlatList real para usar scrollToIndex sin @ts-ignore
  const listRef = useRef<FlatList<T>>(null);

  const keyFn: KeyFn<T> = useMemo(
    () => getKey ?? ((_, i) => String(i)),
    [getKey]
  );

  // Sincroniza el pager cuando cambia index externamente
  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({ index, animated: true });
    });
  }, [index]);

  const handleHScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset?.x || 0;
      const i = Math.round(x / PAGE_W);
      if (i !== index) onIndexChange(i);
    },
    [PAGE_W, index, onIndexChange]
  );

  return (
    <AnimatedFlatList<T>
      ref={listRef}
      data={items}
      keyExtractor={(item, i) => keyFn(item, i)}
      horizontal
      pagingEnabled
      decelerationRate="fast"
      disableIntervalMomentum
      showsHorizontalScrollIndicator={false}
      renderItem={({ item, index: i }) => (
        <View style={{ width: PAGE_W }}>{renderPage(item, i)}</View>
      )}
      getItemLayout={(_, i) => ({ length: PAGE_W, offset: PAGE_W * i, index: i })}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false, listener: handleHScroll }
      )}
      onMomentumScrollEnd={handleHScroll}
      scrollEventThrottle={16}
      removeClippedSubviews
      windowSize={3}
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      style={style as any}
    />
  );
}

export default SegmentedPager;