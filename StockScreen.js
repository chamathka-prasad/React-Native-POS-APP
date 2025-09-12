import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

export default function StockScreen({ navigation }) {

  // --- Navigation Handlers ---
  const goToProduct = () => navigation.navigate('ProductList'); // *** UPDATED NAV TARGET ***
  const goToBillingHistory = () => navigation.navigate('BillingHistory');
  const goToReturnProduct = () => navigation.navigate('ReturnProduct');
  // --- End Navigation Handlers ---

  return (
    <SafeAreaView style={stylesStock.safeArea}>
      <View style={stylesStock.container}>
        {/* Product Button */}
        <TouchableOpacity style={stylesStock.menuButton} onPress={goToProduct}>
          <Text style={stylesStock.menuIcon}>🏷️</Text>
          <Text style={stylesStock.menuButtonText}>Products</Text> {/* Updated Label */}
        </TouchableOpacity>

        {/* Billing History Button */}
        <TouchableOpacity style={stylesStock.menuButton} onPress={goToBillingHistory}>
          <Text style={stylesStock.menuIcon}>📜</Text>
          <Text style={stylesStock.menuButtonText}>Billing History</Text>
        </TouchableOpacity>

        {/* Return Product Button */}
        <TouchableOpacity style={stylesStock.menuButton} onPress={goToReturnProduct}>
          <Text style={stylesStock.menuIcon}>↩️</Text>
          <Text style={stylesStock.menuButtonText}>Return Product</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- Styles for Stock Screen ---
const stylesStock = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light grey background
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
    alignItems: 'center', // Center buttons horizontally
  },
  menuButton: {
    backgroundColor: '#ffffff', // White background for buttons
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'center', // Align icon and text vertically
    width: '95%', // Make buttons wide
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 15, // Space between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee' // Light border
  },
  menuIcon: {
    fontSize: 24, // Icon size
    marginRight: 20, // Space between icon and text
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '500', // Medium weight
    color: '#343a40', // Dark grey text
  },
});