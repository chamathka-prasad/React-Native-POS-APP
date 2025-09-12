import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, ActivityIndicator, Alert, Button } from 'react-native';
import { getBillById, getBillItemsByBillId } from './database'; // Import DB functions

export default function BillDetailScreen({ route, navigation }) {
  const [billHeader, setBillHeader] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { billId } = route.params || {}; // Get billId passed from history screen

  // --- Fetch Bill Details ---
  useEffect(() => {
    if (!billId) {
      Alert.alert("Error", "No Bill ID provided.");
      setIsLoading(false);
      if (navigation.canGoBack()) navigation.goBack();
      return;
    }

    const loadBillData = async () => {
      setIsLoading(true);
      try {
        // Fetch header and items concurrently
        const [headerResult, itemsResult] = await Promise.all([
          getBillById(billId),
          getBillItemsByBillId(billId)
        ]);

        if (headerResult) {
          setBillHeader(headerResult);
          setBillItems(itemsResult || []); // Use empty array if items fetch fails or returns null
        } else {
          Alert.alert("Not Found", `Bill with ID ${billId} not found.`);
          setBillHeader(null);
          setBillItems([]);
        }
      } catch (error) {
        console.error("Failed to load bill details:", error);
        Alert.alert("Error", "Could not load bill details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadBillData();
  }, [billId, navigation]);

  // --- Render Item for Bill Items FlatList ---
  const renderBillItemDetail = ({ item }) => (
    <View style={stylesBillDetail.itemDetailContainer}>
      <View style={stylesBillDetail.itemDetailInfo}>
        <Text style={stylesBillDetail.itemDetailName} numberOfLines={1}>
          {item.product_name || `Product ID: ${item.product_id_fk}`}
        </Text>
        {/* Updated Currency */}
        <Text style={stylesBillDetail.itemDetailPrice}>
          Rs. {item.price_at_sale.toFixed(2)} x {item.quantity}
        </Text>
      </View>
      {/* Updated Currency */}
      <Text style={stylesBillDetail.itemDetailTotal}>Rs. {item.item_total.toFixed(2)}</Text>
    </View>
  );

  // --- Render Loading or Not Found ---
  if (isLoading) {
    return (
      <SafeAreaView style={stylesBillDetail.safeArea}>
        <View style={[stylesBillDetail.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!billHeader) {
    return (
      <SafeAreaView style={stylesBillDetail.safeArea}>
        <View style={[stylesBillDetail.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={stylesBillDetail.notFoundText}>Bill not found.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Bill Details ---
  return (
    <SafeAreaView style={stylesBillDetail.safeArea}>
      <View style={stylesBillDetail.container}>
        {/* Bill Header Info */}
        <View style={stylesBillDetail.headerContainer}>
          <Text style={stylesBillDetail.headerTitle}>Bill Details</Text>
          <Text style={stylesBillDetail.headerText}>Bill ID: {billHeader.bill_id}</Text>
          <Text style={stylesBillDetail.headerText}>Date: {new Date(billHeader.date).toLocaleString()}</Text>
          <Text style={stylesBillDetail.headerText}>Subtotal: Rs. {billHeader.subtotal.toFixed(2)}</Text>
          <Text style={stylesBillDetail.headerText}>Discount: Rs. {billHeader.discount.toFixed(2)}</Text>
          <Text style={stylesBillDetail.headerFinalTotal}>Final Total: Rs. {billHeader.final_total.toFixed(2)}</Text>
        </View>

        {/* Bill Items List */}
        <Text style={stylesBillDetail.itemsTitle}>Items</Text>
        <FlatList
          data={billItems}
          renderItem={renderBillItemDetail}
          keyExtractor={(item) => item.item_id.toString()} // Use item_id as key
          style={stylesBillDetail.list}
          contentContainerStyle={stylesBillDetail.listContent}
          ItemSeparatorComponent={() => <View style={stylesBillDetail.separator} />}
          ListEmptyComponent={<Text style={stylesBillDetail.emptyText}>No items found for this bill.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

// --- Styles for Bill Detail Screen ---
const stylesBillDetail = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  headerContainer: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  headerText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 5,
  },
  headerFinalTotal: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#28a745', // Green
      marginTop: 5,
  },
  itemsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 10,
      marginTop: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemDetailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10, // More vertical padding
    backgroundColor: '#f8f9fa', // Slightly different background for items
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  itemDetailInfo: {
      flex: 1, // Allow text to take space
      marginRight: 10,
  },
  itemDetailName: {
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 3,
  },
  itemDetailPrice: {
      fontSize: 12,
      color: '#555',
  },
  itemDetailTotal: {
      fontSize: 14,
      fontWeight: 'bold',
      minWidth: 80, // Ensure space
      textAlign: 'right',
  },
  separator: {
    height: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#6c757d',
  },
   notFoundText: {
      fontSize: 18,
      color: '#6c757d',
      marginBottom: 20,
      textAlign: 'center',
  },
});
