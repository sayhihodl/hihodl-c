# ⚡ Ejemplos Rápidos - API Integration

**Copia y pega estos ejemplos para integrar rápidamente**

---

## 📱 Dashboard - Mostrar Balances

```typescript
import { useBalances } from '@/hooks/useBalances';
import { useUser } from '@/hooks/useUser';
import { useTransfers } from '@/hooks/useTransfers';

export default function Dashboard() {
  const { balances, loading, error, refresh } = useBalances({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const { user } = useUser();
  const { transfers } = useTransfers({ limit: 10 });

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <ScrollView refreshControl={<RefreshControl onRefresh={handleRefresh} />}>
      <Text>Welcome, {user?.profile?.displayName || user?.email}</Text>
      {balances.map((balance) => (
        <BalanceItem key={balance.id} balance={balance} />
      ))}
    </ScrollView>
  );
}
```

---

## 💸 Send Screen - Enviar Pago

```typescript
import { sendPayment } from '@/services/api/payments.service';
import { getTransferQuote } from '@/services/api/transfers.service';
import { useBalances } from '@/hooks/useBalances';
import { Alert } from 'react-native';

export default function SendScreen() {
  const { balances, refresh: refreshBalances } = useBalances();

  const handleSend = async (params: {
    to: string;
    tokenId: string;
    chain: ChainKey;
    amount: string;
    account: AccountType;
  }) => {
    try {
      // Opcional: Obtener quote para mostrar fees
      const quote = await getTransferQuote({
        from: userAddress,
        to: params.to,
        tokenId: params.tokenId,
        chain: params.chain,
        amount: params.amount,
      });

      // Enviar pago
      const result = await sendPayment({
        to: params.to,
        tokenId: params.tokenId,
        chain: params.chain,
        amount: params.amount,
        account: params.account,
      });

      // Actualizar balances
      await refreshBalances();

      // Navegar a confirmación
      router.push(`/payments/tx-details/${result.txId}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      {/* UI del formulario */}
      <Button onPress={() => handleSend(sendParams)} title="Send" />
    </View>
  );
}
```

---

## 📥 Receive Screen - Mostrar QR

```typescript
import { useReceiveAddress } from '@/hooks/useReceiveAddress';
import { useWallets } from '@/hooks/useWallets';
import QRCode from 'react-native-qrcode-svg';

export default function ReceiveScreen() {
  const { wallets } = useWallets();
  const selectedWallet = wallets[0];

  const { data: receiveAddress, loading, error } = useReceiveAddress(
    selectedWallet?.id || '',
    'sol',
    { reuse: 'current', account: 'daily' }
  );

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View>
      <QRCode value={receiveAddress?.address || ''} />
      <Text>{receiveAddress?.address}</Text>
    </View>
  );
}
```

---

## 💳 Payments Screen - Lista y Envío

```typescript
import { sendPayment, createPaymentRequest } from '@/services/api/payments.service';
import { useTransfers } from '@/hooks/useTransfers';
import { useBalances } from '@/hooks/useBalances';

export default function PaymentsScreen() {
  const { transfers, loading, loadMore, hasMore } = useTransfers({
    limit: 20,
    autoRefresh: true,
  });
  const { balances, refresh: refreshBalances } = useBalances();

  const handleSend = async (params: PaymentSendRequest) => {
    try {
      const result = await sendPayment(params);
      await refreshBalances();
      // Mostrar éxito
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRequest = async (params: PaymentRequestCreateRequest) => {
    try {
      const result = await createPaymentRequest(params);
      // Mostrar link o QR
      const link = `https://hihodl.app/pay/${result.requestId}`;
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <FlatList
      data={transfers}
      renderItem={({ item }) => <TransferItem transfer={item} />}
      onEndReached={loadMore}
      ListFooterComponent={hasMore ? <Loading /> : null}
    />
  );
}
```

---

## ⚙️ Settings Screen

```typescript
import { getSettings, updateSettings, getSettingsLimits } from '@/services/api/settings.service';
import { useUser } from '@/hooks/useUser';
import { useState, useEffect } from 'react';

export default function SettingsScreen() {
  const { user, updateUserProfile } = useUser();
  const [settings, setSettings] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, limitsData] = await Promise.all([
        getSettings(),
        getSettingsLimits(),
      ]);
      setSettings(settingsData);
      setLimits(limitsData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    try {
      const updated = await updateSettings(updates);
      setSettings(updated);
      Alert.alert('Success', 'Settings updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  if (loading) return <Loading />;

  return (
    <View>
      <Text>Plan: {limits?.plan}</Text>
      <Text>Daily Limit: ${limits?.limits.dailyUSD}</Text>
      {/* Más UI */}
    </View>
  );
}
```

---

## 🔒 Security Screen - Sesiones

```typescript
import { listSessions, revokeSession, revokeAllSessions } from '@/services/api/sessions.service';
import { useState, useEffect } from 'react';

export default function SecurityScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { sessions: data } = await listSessions();
      setSessions(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      await loadSessions();
      Alert.alert('Success', 'Session revoked');
    } catch (error) {
      Alert.alert('Error', 'Failed to revoke session');
    }
  };

  return (
    <FlatList
      data={sessions}
      renderItem={({ item }) => (
        <View>
          <Text>{item.deviceName}</Text>
          <Text>{item.lastActiveAt}</Text>
          {!item.currentSession && (
            <Button onPress={() => handleRevoke(item.id)} title="Revoke" />
          )}
        </View>
      )}
    />
  );
}
```

---

## 📇 Contacts Screen

```typescript
import { listContacts, createContact, deleteContact } from '@/services/api/contacts.service';
import { useState, useEffect } from 'react';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await listContacts();
      setContacts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (params: CreateContactRequest) => {
    try {
      const newContact = await createContact(params);
      setContacts([...contacts, newContact]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  return (
    <FlatList
      data={contacts}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>{item.address}</Text>
          <Button onPress={() => handleDelete(item.id)} title="Delete" />
        </View>
      )}
    />
  );
}
```

---

## 🔍 Search Screen

```typescript
import { searchUsers, searchTokens } from '@/services/api/search.service';
import { useState } from 'react';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return;
    
    setLoading(true);
    try {
      const [usersData, tokensData] = await Promise.all([
        searchUsers(searchQuery),
        searchTokens(searchQuery),
      ]);
      setUsers(usersData.users);
      setTokens(tokensData.tokens);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleSearch(query)}
      />
      {loading && <Loading />}
      <Text>Users:</Text>
      {users.map(user => (
        <UserItem key={user.id} user={user} />
      ))}
      <Text>Tokens:</Text>
      {tokens.map(token => (
        <TokenItem key={token.symbol} token={token} />
      ))}
    </View>
  );
}
```

---

## 🎯 Manejo de Errores Estándar

```typescript
import { ApiClientError } from '@/lib/apiClient';

try {
  await sendPayment(params);
} catch (error) {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        router.push('/auth/login');
        break;
      case 'INSUFFICIENT_BALANCE':
        Alert.alert('Insufficient Balance', 'You don\'t have enough funds');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        Alert.alert('Too Many Requests', 'Please try again later');
        break;
      case 'VALIDATION_ERROR':
        Alert.alert('Invalid Input', error.message);
        break;
      default:
        Alert.alert('Error', error.message);
    }
  } else {
    Alert.alert('Error', 'An unexpected error occurred');
  }
}
```

---

## 🔄 Pull to Refresh

```typescript
import { RefreshControl } from 'react-native';

const { balances, loading, refresh } = useBalances();

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={loading}
      onRefresh={refresh}
    />
  }
>
  {/* Contenido */}
</ScrollView>
```

---

**¡Copia, pega y adapta! 🚀**




