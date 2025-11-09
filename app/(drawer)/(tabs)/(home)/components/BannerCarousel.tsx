// app/(drawer)/(tabs)/(home)/components/BannerCarousel.tsx
// Componente para mostrar carousel de banners en el Dashboard

import React, { memo, useState, useRef } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { type BannerItem } from "@/store/dashboard.types";
import { DASHBOARD_COLORS } from "@/constants/dashboard";

const PEEK = DASHBOARD_COLORS.bannerPeek;
const GAP = PEEK;
const BODY_PAD = DASHBOARD_COLORS.bodyPad;
const CLOSE_COLOR = DASHBOARD_COLORS.closeButton;

const bannerStyles = StyleSheet.create({
  bannerCard: {
    backgroundColor: "rgba(27,45,54,0.85)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bannerTitle: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  bannerBody: { color: "#FFFFFF", fontSize: 13 },
  bannerUntil: { color: "#9eb4bd", fontSize: 12 },
  bannerCtaTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 3,
  },
  bannerDotOn: { backgroundColor: "#fff" },
});

interface BannerCarouselProps {
  data: BannerItem[];
  onDismiss: (id: string) => void;
  onPressCta?: (b: BannerItem) => void;
  width: number;
}

/**
 * Carousel de banners para el Dashboard
 * Muestra banners en un scroll horizontal con indicadores de página
 */
const BannerCarousel = memo(function BannerCarousel({
  data,
  onDismiss,
  onPressCta,
  width,
}: BannerCarouselProps) {
  const { t } = useTranslation(["dashboard", "common"]);

  const CARD_W = width - BODY_PAD * 2 - PEEK;

  const [index, setIndex] = useState(0);
  const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 20 }).current;
  const onViewChanged = useRef(
    (params: { viewableItems: { index?: number | null }[] }) => {
      const i = params.viewableItems?.[0]?.index;
      if (i != null) setIndex(i);
    }
  ).current;

  return (
    <View style={{ marginTop: 10 }}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: BODY_PAD, paddingRight: BODY_PAD - PEEK }}
        onViewableItemsChanged={onViewChanged}
        viewabilityConfig={viewCfg}
        renderItem={({ item, index: i }) => (
          <View style={{ width: CARD_W, marginRight: i === data.length - 1 ? 0 : GAP }}>
            <View style={bannerStyles.bannerCard}>
              <View style={{ flex: 1 }}>
                <Text style={bannerStyles.bannerTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={bannerStyles.bannerBody} numberOfLines={3}>
                  {item.body}
                </Text>
                {!!item.until && (
                  <Text style={bannerStyles.bannerUntil}>{item.until}</Text>
                )}
                {!!item.cta && (
                  <Pressable
                    style={{
                      marginTop: 6,
                      backgroundColor: "#0A1A24",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      alignSelf: "flex-start",
                    }}
                    onPress={() => onPressCta?.(item)}
                    hitSlop={6}
                  >
                    <Text style={bannerStyles.bannerCtaTxt}>{item.cta.label}</Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => onDismiss(item.id)}
                style={{ marginLeft: 8, marginTop: 2, alignSelf: "flex-start" }}
                hitSlop={10}
                accessibilityLabel={t("dashboard:dismiss", "Dismiss")}
              >
                <Ionicons name="close" size={13} color={CLOSE_COLOR} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {data.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
          {data.map((_, i) => (
            <View
              key={i}
              style={[
                bannerStyles.bannerDot,
                i === index && bannerStyles.bannerDotOn,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

export default BannerCarousel;






