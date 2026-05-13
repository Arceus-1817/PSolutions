import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter both email and password.');
    setLoading(true);
    try {
      // 1. Hit your Spring Boot backend
      const response = await api.post('/api/auth/login', { email, password });
      
      const data = response.data;
      
      // 🚨 CRASH-PROOF FIX: Safely extract variables no matter what Spring Boot names them!
      const actualToken = data.token || data.jwt || data.accessToken;
      const actualRole = data.role || data.user?.role;
      const actualName = data.name || data.user?.name || 'Agent';
      const actualId = data.id || data.user?.id || data.userId || '1';

      if (!actualToken) {
         Alert.alert("Error", "Backend returned 200 OK, but no JWT was found in the response.");
         return;
      }

      // 2. The Agent Security Wall
      if (actualRole !== 'AGENT') {
        Alert.alert('Access Denied', 'This app is strictly for Field Agents. Please use the Web Dashboard.');
        return;
      }

      // 3. Save to mobile device storage safely (forcing them to Strings so AsyncStorage doesn't crash)
      await AsyncStorage.setItem('userToken', String(actualToken));
      await AsyncStorage.setItem('userName', String(actualName));
      await AsyncStorage.setItem('userId', String(actualId));

      // 4. Send them to the Home screen
      navigation.replace('Home');
    } catch (error) {
      // 🚨 FIX: Actually print the REAL error instead of a generic internet message
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Unknown error occurred.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.logoContainer}>
        <View style={styles.iconBox}><Text style={styles.iconText}>₿</Text></View>
        <Text style={styles.logo}>Pigmy<Text style={styles.logoAccent}>Pay</Text></Text>
        <Text style={styles.subtitle}>AGENT TERMINAL</Text>
      </View>

      <View style={styles.form}>
        <TextInput 
          style={styles.input} 
          placeholder="Agent Email" 
          placeholderTextColor="#4a5568"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Secure Password" 
          placeholderTextColor="#4a5568"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>SECURE LOGIN</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c0f', justifyContent: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconText: { fontSize: 24, color: '#00ff88', fontWeight: 'bold' },
  logo: { fontSize: 32, fontWeight: '800', color: '#e2e8f0' },
  logoAccent: { color: '#00ff88' },
  subtitle: { fontSize: 12, color: '#4a5568', letterSpacing: 2, marginTop: 5, fontWeight: '600' },
  form: { width: '100%' },
  input: { backgroundColor: '#111318', borderWidth: 1, borderColor: '#1e2530', color: '#e2e8f0', borderRadius: 10, padding: 16, fontSize: 16, marginBottom: 16 },
  button: { backgroundColor: '#00ff88', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});