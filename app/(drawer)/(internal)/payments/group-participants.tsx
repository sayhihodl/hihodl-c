// app/(drawer)/(internal)/payments/group-participants.tsx
import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenBg from "@/ui/ScreenBg";
import GlassHeader from "@/ui/GlassHeader";
import ControlledBottomSheet from "@/components/BottomSheet/ControlledBottomSheet";
import SearchField from "@/ui/SearchField";
import { TextInput } from "react-native";
import type { RecipientKind } from "@/send/types";

// Mock data para participantes (en producción esto vendría del store o API)
const MOCK_USERS = [
  { id: "1", name: "Alex", alias: "@helloalex", emoji: "👋" },
  { id: "2", name: "Maria", alias: "@maria", emoji: "✨" },
  { id: "3", name: "Luna", alias: "@luna", emoji: "🌙" },
  { id: "4", name: "John", alias: "@john", emoji: "🎯" },
  { id: "5", name: "Li", alias: "@li", emoji: "🌟" },
  { id: "6", name: "Cami", alias: "@cami", emoji: "💫" },
  { id: "7", name: "Memo", alias: "@memo", emoji: "📝" },
  { id: "8", name: "Pablo", alias: "@pablo", emoji: "🎨" },
  { id: "9", name: "Noa", alias: "@noa", emoji: "🌸" },
  { id: "10", name: "Lucas", alias: "@lucas", emoji: "⚡" },
];

type Participant = {
  id: string;
  name: string;
  alias: string;
  emoji?: string;
  avatar?: string;
};

export default function GroupParticipantsScreen() {
  const insets = useSafeAreaInsets();
  const { id = "", name = "Group", alias, avatar, emoji } = useLocalSearchParams<{
    id?: string;
    name?: string;
    alias?: string;
    avatar?: string;
    emoji?: string;
  }>();

  // Estado para participantes del grupo (inicialmente mock, pero debería venir del store)
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", name: "Alex", alias: "@helloalex", emoji: "👋" },
    { id: "2", name: "Maria", alias: "@maria", emoji: "✨" },
    { id: "3", name: "Luna", alias: "@luna", emoji: "🌙" },
  ]);

  // Estado para el modal de agregar participantes
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  // Filtrar usuarios disponibles (excluyendo los que ya son participantes)
  const availableUsers = useMemo(() => {
    const participantIds = new Set(participants.map((p) => p.id));
    const q = searchQuery.trim().toLowerCase();
    
    let filtered = MOCK_USERS.filter((u) => !participantIds.has(u.id));
    
    if (q) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.alias.toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [participants, searchQuery]);

  const handleAddParticipant = (user: typeof MOCK_USERS[0]) => {
    // Agregar participante si no está ya en la lista
    if (!participants.find((p) => p.id === user.id)) {
      setParticipants([...participants, user]);
      setSearchQuery("");
      // Opcional: cerrar modal después de agregar
      // setShowAddModal(false);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants(participants.filter((p) => p.id !== participantId));
  };

  const handleSave = () => {
    // Aquí deberías guardar los participantes en el store/API
    // Por ahora solo navegamos de vuelta
    router.back();
  };

  const HEADER_H = insets.top + 6 + 54;

  return (
    <View style={styles.screen}>
      <ScreenBg account="Daily" height={160} showTopSeam />

      {/* Header */}
      <GlassHeader
        scrolly={undefined as any}
        blurTint="dark"
        overlayColor="rgba(7,16,22,0.45)"
        height={54}
        innerTopPad={6}
        sideWidth={60}
        centerWidthPct={60}
        leftSlot={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
        }
        centerSlot={
          <View style={styles.headerCenter}>
            {emoji ? (
              <View style={styles.avatarCircle}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
              </View>
            ) : avatar ? (
              <Image source={{ uri: String(avatar) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={{ fontSize: 16 }}>👥</Text>
              </View>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name}
            </Text>
          </View>
        }
        rightSlot={null}
        contentStyle={{ paddingHorizontal: 12 }}
      />

      {/* Lista de participantes */}
      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: HEADER_H + 16,
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 80,
        }}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
            <Pressable
              onPress={() => {
                setShowAddModal(true);
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 300);
              }}
              style={styles.addButton}
            >
              <Ionicons name="add-circle" size={20} color="#FFB703" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.participantItem}>
            <View style={styles.participantLeft}>
              {item.emoji ? (
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                </View>
              ) : item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{item.name}</Text>
                <Text style={styles.participantAlias}>{item.alias}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => handleRemoveParticipant(item.id)}
              hitSlop={8}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No participants yet</Text>
          </View>
        }
      />

      {/* Botón Save en el footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          accessibilityRole="button"
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      {/* Modal para agregar participantes */}
      <ControlledBottomSheet
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSearchQuery("");
        }}
        title="Add Participants"
        subtitle="Search users from HiHODL"
        closeOnBackdrop
      >
        <View style={styles.modalContent}>
          <View style={styles.searchContainer}>
            <SearchField
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search @username..."
              height={44}
              onClear={() => setSearchQuery("")}
              inputProps={{
                autoCapitalize: "none",
                autoCorrect: false,
                returnKeyType: "search",
              }}
            />
          </View>

          <FlatList
            data={availableUsers}
            keyExtractor={(item) => item.id}
            style={styles.userList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleAddParticipant(item)}
                style={styles.userItem}
              >
                <View style={styles.userLeft}>
                  {item.emoji ? (
                    <View style={styles.avatarCircle}>
                      <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                    </View>
                  ) : (
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarInitial}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userAlias}>{item.alias}</Text>
                  </View>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#FFB703" />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptySearchState}>
                <Text style={styles.emptySearchText}>
                  {searchQuery.trim()
                    ? "No users found"
                    : "Search for users to add"}
                </Text>
              </View>
            }
          />
        </View>
      </ControlledBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1820",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 220,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#9CC6D1",
    fontWeight: "900",
    fontSize: 14,
  },
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 183, 3, 0.15)",
  },
  addButtonText: {
    color: "#FFB703",
    fontWeight: "800",
    fontSize: 14,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  participantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  participantAlias: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(6,14,20,0.95)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  saveButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFB703",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#0A1A24",
    fontWeight: "900",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
  },
  modalContent: {
    paddingVertical: 8,
  },
  searchContainer: {
    marginBottom: 16,
  },
  userList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  userLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  userAlias: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2,
  },
  emptySearchState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptySearchText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
  },
});

