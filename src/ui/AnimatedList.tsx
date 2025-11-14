// src/ui/AnimatedList.tsx
// Animated List Component with staggered animations, gradients, and keyboard navigation

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Text,
  type FlatListProps,
  type ListRenderItem,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeInDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Componente separado para cada item (necesario para usar hooks)
function AnimatedListItem<T>({
  item,
  index,
  itemContent,
  isSelected,
  scrollY,
  itemHeight,
  animationDelay,
}: {
  item: T;
  index: number;
  itemContent: React.ReactNode;
  isSelected: boolean;
  scrollY: Animated.SharedValue<number>;
  itemHeight: number;
  animationDelay: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (itemHeight > 0) {
      const opacity = interpolate(
        scrollY.value,
        [(index - 2) * itemHeight, index * itemHeight, (index + 2) * itemHeight],
        [0.3, 1, 0.3],
        Extrapolation.CLAMP
      );
      return { opacity };
    }
    return {};
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * animationDelay).springify().damping(15)}
      exiting={FadeOutUp.duration(200)}
      style={animatedStyle}
    >
      <View style={isSelected ? { opacity: 0.9 } : undefined}>
        {itemContent}
      </View>
    </Animated.View>
  );
}

interface AnimatedListProps<T> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  renderItem?: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  itemHeight?: number;
  animationDelay?: number;
  // FlatList props passthrough
  contentContainerStyle?: FlatListProps<T>['contentContainerStyle'];
  style?: FlatListProps<T>['style'];
  ListHeaderComponent?: FlatListProps<T>['ListHeaderComponent'];
  ListFooterComponent?: FlatListProps<T>['ListFooterComponent'];
  ItemSeparatorComponent?: FlatListProps<T>['ItemSeparatorComponent'];
  onEndReached?: FlatListProps<T>['onEndReached'];
  onEndReachedThreshold?: FlatListProps<T>['onEndReachedThreshold'];
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollEnabled?: boolean;
  onScroll?: (event: any) => void;
}

/**
 * AnimatedList - Lista con animaciones escalonadas, gradientes y navegación por teclado
 */
export default function AnimatedList<T = any>({
  items,
  onItemSelect,
  renderItem,
  keyExtractor,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  itemHeight = 64,
  animationDelay = 50,
  contentContainerStyle,
  style,
  ListHeaderComponent,
  ListFooterComponent,
  ItemSeparatorComponent,
  onEndReached,
  onEndReachedThreshold,
  refreshing,
  onRefresh,
  scrollEnabled = true,
  onScroll: externalOnScroll,
}: AnimatedListProps<T>) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<T>>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollY = useSharedValue(0);
  const gradientOpacity = useSharedValue(showGradients ? 1 : 0);


  // Default renderItem si no se proporciona
  const defaultRenderItem = useCallback(
    (item: T, index: number) => {
      if (typeof item === 'string') {
        return (
          <Pressable
            onPress={() => onItemSelect?.(item, index)}
            style={({ pressed }) => [
              styles.defaultItem,
              pressed && styles.defaultItemPressed,
            ]}
          >
            <Text style={styles.defaultItemText}>{String(item)}</Text>
          </Pressable>
        );
      }
      return (
        <View style={styles.defaultItem}>
          <Text style={styles.defaultItemText}>{String(item)}</Text>
        </View>
      );
    },
    [onItemSelect]
  );

  // Render item wrapper con animación
  const renderItemWithAnimation: ListRenderItem<T> = useCallback(
    ({ item, index }) => {
      const itemContent = renderItem ? renderItem(item, index) : defaultRenderItem(item, index);
      const isSelected = selectedIndex === index;

      return (
        <AnimatedListItem
          item={item}
          index={index}
          itemContent={itemContent}
          isSelected={isSelected}
          scrollY={scrollY}
          itemHeight={itemHeight}
          animationDelay={animationDelay}
        />
      );
    },
    [renderItem, defaultRenderItem, selectedIndex, scrollY, itemHeight, animationDelay]
  );

  // Navegación con flechas del teclado (solo en web)
  useEffect(() => {
    if (!enableArrowNavigation || Platform.OS !== 'web') return;

    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (selectedIndex === null) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setSelectedIndex(0);
          return;
        }
      }

      if (e.key === 'ArrowDown') {
        setSelectedIndex((prev) => {
          const next = prev === null ? 0 : Math.min(prev + 1, items.length - 1);
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((prev) => {
          const next = prev === null ? 0 : Math.max((prev ?? 0) - 1, 0);
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      } else if (e.key === 'Enter' && selectedIndex !== null) {
        onItemSelect?.(items[selectedIndex], selectedIndex);
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [enableArrowNavigation, selectedIndex, items, onItemSelect]);

  // Estilo animado para gradientes
  const topGradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [0, gradientOpacity.value],
      Extrapolation.CLAMP
    ),
  }));

  const bottomGradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  // Default keyExtractor
  const defaultKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) return keyExtractor(item, index);
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      return `item-${index}`;
    },
    [keyExtractor]
  );

  return (
    <View style={styles.container}>
      <FlatList<T>
        ref={flatListRef}
        data={items}
        keyExtractor={defaultKeyExtractor}
        renderItem={renderItemWithAnimation}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 16 },
          contentContainerStyle,
        ]}
        style={[styles.list, style]}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={displayScrollbar}
        onScroll={(e) => {
          // Actualizar scrollY para las animaciones internas
          scrollY.value = e.nativeEvent.contentOffset.y;
          
          // Si externalOnScroll es una función, llamarla
          if (typeof externalOnScroll === 'function') {
            externalOnScroll(e);
          }
          // Si es Animated.event de react-native, manejarlo
          else if (externalOnScroll && typeof externalOnScroll === 'object') {
            // Intentar ejecutar el listener si existe
            const eventObj = externalOnScroll as any;
            if (eventObj.listener && typeof eventObj.listener === 'function') {
              eventObj.listener(e);
            }
          }
        }}
        scrollEventThrottle={16}
        // Optimizaciones de rendimiento
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        getItemLayout={
          itemHeight > 0
            ? (_, index) => ({
                length: itemHeight,
                offset: itemHeight * index,
                index,
              })
            : undefined
        }
      />

      {/* Gradientes superior e inferior */}
      {showGradients && (
        <>
          <Animated.View
            style={[styles.gradientContainer, styles.topGradient, topGradientStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[colors.navBg, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={[styles.gradientContainer, styles.bottomGradient, bottomGradientStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', colors.navBg]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  defaultItem: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
    justifyContent: 'center',
  },
  defaultItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.9,
  },
  defaultItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  gradientContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  topGradient: {
    top: 0,
  },
  bottomGradient: {
    bottom: 0,
  },
});

