import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getAllBills } from './database'; // Import DB function

export default function BillingHistoryScreen({ navigation }) { // Added navigation prop
  const [billsHistory, setBillsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();

  // --- Fetch Bills History ---
  const loadBillsHistory = async () => {
    setIsLoading(true);
    try {
      const dbResult = await getAllBills();
      setBillsHistory(dbResult);
    } catch (error) {
      console.error("Failed to load billing history:", error);
      Alert.alert("Error", "Could not load billing history.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Load history when screen comes into focus ---
  useEffect(() => {
    if (isFocused) {
      console.log("BillingHistoryScreen focused, loading bills...");
      loadBillsHistory();
    }
  }, [isFocused]);

  // --- Render Item for FlatList ---
  const renderBillItem = ({ item }) => (
    // *** UPDATED: Navigate to BillDetail on press ***
    <TouchableOpacity
       style={stylesHistory.itemContainer}
       onPress={() => navigation.navigate('BillDetail', { billId: item.bill_id })} // Pass billId
    >
      <View style={stylesHistory.itemRow}>
        <Text style={stylesHistory.itemLabel}>Bill ID:</Text>
        <Text style={stylesHistory.itemValue}>{item.bill_id}</Text>
      </View>
      <View style={stylesHistory.itemRow}>
        <Text style={stylesHistory.itemLabel}>Date:</Text>
        <Text style={stylesHistory.itemValue}>{new Date(item.date).toLocaleString()}</Text>
      </View>
      <View style={stylesHistory.itemRow}>
        <Text style={stylesHistory.itemLabel}>Subtotal:</Text>
        {/* Updated Currency */}
        <Text style={stylesHistory.itemValue}>Rs. {item.subtotal.toFixed(2)}</Text>
      </View>
       <View style={stylesHistory.itemRow}>
        <Text style={stylesHistory.itemLabel}>Discount:</Text>
         {/* Updated Currency */}
        <Text style={stylesHistory.itemValue}>Rs. {item.discount.toFixed(2)}</Text>
      </View>
       <View style={stylesHistory.itemRow}>
        <Text style={stylesHistory.itemLabel}>Final Total:</Text>
         {/* Updated Currency */}
        <Text style={[stylesHistory.itemValue, stylesHistory.finalTotalValue]}>Rs. {item.final_total.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
  // --- End Render Item ---

  return (
    <SafeAreaView style={stylesHistory.safeArea}>
      <View style={stylesHistory.container}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : billsHistory.length === 0 ? (
          <Text style={stylesHistory.emptyText}>No billing history found.</Text>
        ) : (
          <FlatList
            data={billsHistory}
            renderItem={renderBillItem}
            keyExtractor={(item) => item.bill_id.toString()}
            style={stylesHistory.list}
            contentContainerStyle={stylesHistory.listContent}
            ItemSeparatorComponent={() => <View style={stylesHistory.separator} />}
            refreshing={isLoading}
            onRefresh={loadBillsHistory} // Allow pull-to-refresh
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Styles for Billing History Screen ---
const stylesHistory = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    paddingTop: 10, // Add padding top
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
  },
  itemLabel: {
      fontSize: 14,
      color: '#555',
      fontWeight: '500',
  },
  itemValue: {
      fontSize: 14,
      color: '#333',
  },
  finalTotalValue: {
      fontWeight: 'bold',
      color: '#28a745', // Green
  },
  separator: {
    height: 10,
  },
  emptyText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center', // Center vertically too
    fontSize: 16,
    color: '#6c757d',
  },
});

