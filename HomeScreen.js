import React from 'react'; // Keep React import
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'; // Keep imports
import { SafeAreaView } from 'react-native-safe-area-context'; // Keep import

// Receive navigation and softSignOut props
export default function HomeScreen({ navigation, softSignOut }) {

  // --- Navigation Handlers ---
  const handleBillingPress = () => {
    navigation.navigate('Billing');
  };

  const handleStockPress = () => {
    navigation.navigate('Stock');
  };
  // --- End Navigation Handlers ---

  return (
    <SafeAreaView style={stylesHome.safeArea}>
      <View style={stylesHome.container}>
        {/* Main action buttons in a row */}
        <View style={stylesHome.buttonRow}>
          {/* Billing Button */}
          <TouchableOpacity style={stylesHome.actionButton} onPress={handleBillingPress}>
            <Text style={stylesHome.actionIcon}>🧾</Text>
            <Text style={stylesHome.actionButtonText}>Billing</Text>
          </TouchableOpacity>

          {/* Stock Button */}
          <TouchableOpacity style={stylesHome.actionButton} onPress={handleStockPress}>
            <Text style={stylesHome.actionIcon}>📦</Text>
            <Text style={stylesHome.actionButtonText}>Stock</Text>
          </TouchableOpacity>
        </View>

         {/* Spacer View */}
         <View style={{ flex: 1 }} />

        {/* Soft Logout / Switch Account Button */}
        <TouchableOpacity style={stylesHome.switchAccountButton} onPress={softSignOut}>
          <Text style={stylesHome.switchAccountButtonText}>Switch Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Styles for the Home Screen
const stylesHome = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#e7f3ff',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#cce4ff'
  },
   actionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#005ecb',
    fontSize: 16,
    fontWeight: '600',
  },
  // Renamed logoutButton to switchAccountButton and styled differently
  switchAccountButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#ffc107', // Warning/yellow color for switch account
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 'auto',
    marginBottom: 20,
     shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchAccountButtonText: {
    color: '#333', // Darker text for yellow background
    fontSize: 18,
    fontWeight: 'bold',
  },
});
