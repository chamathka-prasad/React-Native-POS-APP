import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native'; // Added Image, ScrollView

export default function ProductScreen({ navigation }) {

  // --- Mock Data (Replace with actual data fetching) ---
  const product = {
    id: '123',
    name: 'Sample Product',
    qty: 50,
    price: 29.99,
    salesCount: 120,
    imageUrl: 'https://placehold.co/400x250/007AFF/FFF?text=Product+Image', // Larger placeholder
  };
  // --- End Mock Data ---

  const goToRegisterProduct = () => {
    navigation.navigate('RegisterProduct');
  };

  return (
    <SafeAreaView style={stylesProduct.safeArea}>
      <ScrollView contentContainerStyle={stylesProduct.scrollContainer}>
        <View style={stylesProduct.container}>
          <Text style={stylesProduct.title}>{product.name}</Text>

          {/* Product Image */}
          <Image
            source={{ uri: product.imageUrl }}
            style={stylesProduct.productImage}
            resizeMode="contain" // Adjust as needed (cover, contain, stretch)
            // Add onError for fallback is good practice: onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />

          {/* Product Details */}
          <View style={stylesProduct.detailsContainer}>
            <View style={stylesProduct.detailRow}>
              <Text style={stylesProduct.detailLabel}>Price:</Text>
              <Text style={stylesProduct.detailValue}>${product.price.toFixed(2)}</Text>
            </View>
            <View style={stylesProduct.detailRow}>
              <Text style={stylesProduct.detailLabel}>Quantity:</Text>
              <Text style={stylesProduct.detailValue}>{product.qty}</Text>
            </View>
            <View style={stylesProduct.detailRow}>
              <Text style={stylesProduct.detailLabel}>Sales Count:</Text>
              <Text style={stylesProduct.detailValue}>{product.salesCount}</Text>
            </View>
          </View>

          {/* Register New Product Button */}
          <TouchableOpacity style={stylesProduct.registerButton} onPress={goToRegisterProduct}>
            <Text style={stylesProduct.registerButtonText}>Register New Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles for Product Screen ---
const stylesProduct = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff', // White background
  },
  scrollContainer: {
      flexGrow: 1, // Ensure ScrollView content can grow
      paddingBottom: 40, // Padding at the bottom
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center', // Center items horizontally
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  productImage: {
    width: '90%', // Make image large but not full width
    aspectRatio: 16 / 9, // Maintain aspect ratio (adjust as needed)
    height: undefined, // Let height be determined by aspect ratio
    borderRadius: 10, // Rounded corners
    marginBottom: 30,
    backgroundColor: '#eee', // Placeholder background color
  },
  detailsContainer: {
    width: '90%', // Match image width roughly
    backgroundColor: '#f8f9fa', // Light background for details section
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Label on left, value on right
    marginBottom: 12, // Space between rows
    paddingBottom: 12, // Space below text
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Separator line
  },
  detailLabel: {
    fontSize: 16,
    color: '#666', // Grey color for label
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333', // Darker color for value
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#28a745', // Green color for register button
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '90%',
    alignItems: 'center', // Center text inside button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});