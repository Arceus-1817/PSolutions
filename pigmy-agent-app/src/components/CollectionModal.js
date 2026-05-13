import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CollectionModal({ visible, customer, onClose, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState('SAVINGS');
  const [paymentMode, setPaymentMode] = useState('CASH');

  if (!customer) return null;

  const handlePress = (num) => {
    if (amount.length < 6) setAmount(prev => prev + num);
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleQuickAdd = (val) => {
    const current = parseInt(amount || '0');
    setAmount((current + val).toString());
  };

  const handleSkip = () => {
    onConfirm(customer.id, 0, 'NONE', 'SKIPPED_CLOSED');
    setAmount('');
  };

  const submitTransaction = () => {
    if (!amount || parseInt(amount) <= 0) return;
    onConfirm(customer.id, amount, paymentMode, txType, 'PENDING');
    setAmount('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{customer.name}</Text>
              <Text style={styles.subtitle}>ACC: {customer.accountNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Type Toggles */}
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, txType === 'SAVINGS' && styles.toggleActive]} 
              onPress={() => setTxType('SAVINGS')}
            >
              <Text style={[styles.toggleText, txType === 'SAVINGS' && styles.toggleTextActive]}>SAVINGS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              // 🚨 FIX: Make it visually greyed out and unclickable if they don't have a loan!
              style={[styles.toggleBtn, txType === 'EMI' && styles.toggleActive, (!customer.activeDailyEmi || customer.activeDailyEmi <= 0) && { opacity: 0.3 }]} 
              onPress={() => {
                if (!customer.activeDailyEmi || customer.activeDailyEmi <= 0) {
                  // eslint-disable-next-line no-undef
                  Alert.alert("No Loan", "This customer does not have an active loan.");
                  return;
                }
                setTxType('EMI');
                setAmount(customer.activeDailyEmi.toString()); // Auto-fill the exact EMI amount!
              }}
              disabled={!customer.activeDailyEmi || customer.activeDailyEmi <= 0}
            >
              <Text style={[styles.toggleText, txType === 'EMI' && styles.toggleTextActive]}>LOAN EMI</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={styles.amountDisplay}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amountText}>{amount || '0'}</Text>
          </View>

          {/* Quick Adds & Mode */}
          <View style={styles.quickAddRow}>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAdd(100)}><Text style={styles.quickText}>+100</Text></TouchableOpacity>
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => handleQuickAdd(500)}><Text style={styles.quickText}>+500</Text></TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={[styles.modeBtn, paymentMode === 'CASH' && styles.modeActive]} onPress={() => setPaymentMode('CASH')}><Text style={styles.modeText}>💵 CASH</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modeBtn, paymentMode === 'UPI' && styles.modeActive]} onPress={() => setPaymentMode('UPI')}><Text style={styles.modeText}>📱 UPI</Text></TouchableOpacity>
          </View>

          {/* Massive Numpad */}
          <View style={styles.numpad}>
            {[['1','2','3'],['4','5','6'],['7','8','9'],['Skip','0','⌫']].map((row, rIdx) => (
              <View key={rIdx} style={styles.numRow}>
                {row.map(btn => (
                  <TouchableOpacity 
                    key={btn} 
                    style={[styles.numBtn, btn === 'Skip' && styles.skipBtn]} 
                    onPress={() => btn === '⌫' ? handleBackspace() : btn === 'Skip' ? handleSkip() : handlePress(btn)}
                  >
                    <Text style={[styles.numText, btn === 'Skip' && {color: '#ff4757', fontSize: 16}]}>{btn}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={[styles.confirmBtn, (!amount || parseInt(amount) <= 0) && {opacity: 0.5}]} onPress={submitTransaction}>
            <Text style={styles.confirmText}>CONFIRM DEPOSIT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111318', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#e2e8f0' },
  subtitle: { fontSize: 12, color: '#718096', marginTop: 2 },
  closeBtn: { padding: 8, backgroundColor: '#161b22', borderRadius: 12 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#0a0c0f', borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#161b22' },
  toggleText: { color: '#718096', fontSize: 12, fontWeight: 'bold' },
  toggleTextActive: { color: '#00ff88' },
  amountDisplay: { backgroundColor: '#0a0c0f', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#1e2530' },
  currencySymbol: { fontSize: 32, color: '#00ff88', marginRight: 8, fontWeight: 'bold' },
  amountText: { fontSize: 48, fontWeight: 'bold', color: '#e2e8f0', letterSpacing: 2 },
  quickAddRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  quickAddBtn: { backgroundColor: '#161b22', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#1e2530' },
  quickText: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold' },
  modeBtn: { backgroundColor: '#161b22', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1e2530' },
  modeActive: { borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)' },
  modeText: { color: '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
  numpad: { gap: 12, marginBottom: 24 },
  numRow: { flexDirection: 'row', gap: 12 },
  numBtn: { flex: 1, backgroundColor: '#161b22', height: 60, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { backgroundColor: 'rgba(255,71,87,0.1)', borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)' },
  numText: { fontSize: 24, fontWeight: 'bold', color: '#e2e8f0' },
  confirmBtn: { backgroundColor: '#00ff88', paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});