// app/accounts/account/[accountId]/index.tsx
import { Link } from 'expo-router';
import { View, Pressable, Text } from 'react-native';

export default function AccountScreen() {
  return (
    <View>
      <Link href={{ pathname: './all', params: { section: 'tokens' } }} asChild>
        <Pressable><Text>View All Tokens</Text></Pressable>
      </Link>

      <Link href={{ pathname: './all', params: { section: 'payments' } }} asChild>
        <Pressable><Text>View All Payments</Text></Pressable>
      </Link>
    </View>
  );
}