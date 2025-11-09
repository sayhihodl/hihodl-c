// app/auth/callback.tsx
// Handle OAuth callback from Google/Apple
import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { handleOAuthCallback } from '@/auth/oauth';
import { supabase } from '@/lib/supabase';
import colors from '@/theme/colors';

export default function OAuthCallback() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a code in the URL
        const code = params.code as string | undefined;
        const error = params.error as string | undefined;

        if (error) {
          console.error('OAuth error:', error);
          router.replace('/auth/login');
          return;
        }

        if (code) {
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            router.replace('/auth/login');
            return;
          }

          // Success - redirect to dashboard
          // The auth store will be updated automatically via onAuthStateChange
          router.replace('/(drawer)/(tabs)/(home)');
        } else {
          // No code in params, check if we're on web and have hash params
          if (typeof window !== 'undefined' && window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              // Set session manually
              const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) {
                console.error('Error setting session:', sessionError);
                router.replace('/auth/login');
                return;
              }

              router.replace('/(drawer)/(tabs)/(home)');
              return;
            }
          }
          
          // No valid callback data
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/auth/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.cta} />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

