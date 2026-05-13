import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getLedgerStats } from '../database';

export default function LedgerScreen() {
  const [stats, setStats] = useState({ cash: 0, upi: 0 });
  const isFocused = useIsFocused(); // This triggers a refresh every time they click the tab

  useEffect(() => {
    if (isFocused) {
      const currentStats = getLedgerStats();
      setStats(currentStats);
    }
  }, [isFocused]);

  const totalCollected = stats.cash + stats.upi;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>End of Day Ledger</Text>
      
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>TOTAL COLLECTED TODAY</Text>
        <Text style={styles.totalAmount}>₹{totalCollected}</Text>
      </View>

      <View style={styles.breakdownContainer}>
        <View style={styles.statBox}>
          <View style={styles.iconCircle}><Ionicons name="cash-outline" size={24} color="#00ff88" /></View>
          <Text style={styles.statLabel}>Physical Cash</Text>
          <Text style={styles.statValue}>₹{stats.cash}</Text>
          <Text style={styles.subtext}>Owed to Branch</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: '#111318', borderColor: '#1e2530' }]}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: 'rgba(56,189,248,0.3)' }]}>
            <Ionicons name="phone-portrait-outline" size={24} color="#38bdf8" />
          </View>
          <Text style={styles.statLabel}>UPI Auto-Settled</Text>
          <Text style={styles.statValue}>₹{stats.upi}</Text>
          <Text style={styles.subtext}>Bank Transfer</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#718096" />
        <Text style={styles.infoText}>
          You must physically hand exactly ₹{stats.cash} to the Branch Manager before logging out today.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c0f', paddingTop: 60, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0', marginBottom: 24 },
  totalCard: { backgroundColor: '#00ff88', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  totalLabel: { color: '#000', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  totalAmount: { color: '#000', fontSize: 48, fontWeight: '900' },
  breakdownContainer: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#161b22', borderWidth: 1, borderColor: '#00ff88', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { color: '#718096', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  statValue: { color: '#e2e8f0', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtext: { color: '#4a5568', fontSize: 10, textTransform: 'uppercase' },
  infoBox: { flexDirection: 'row', backgroundColor: '#111318', padding: 16, borderRadius: 12, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#1e2530' },
  infoText: { color: '#718096', fontSize: 12, flex: 1, lineHeight: 18 }
});