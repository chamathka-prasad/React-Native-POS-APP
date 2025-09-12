import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, Image, ActivityIndicator, Alert } from 'react-native'; // Added FlatList, Image, ActivityIndicator, Alert
import { useIsFocused } from '@react-navigation/native'; // Import useIsFocused
import { getAllProducts } from './database'; // Import DB function

// --- Placeholder Image ---
const placeholderImage = require('./assets/placeholder-image.png');
// --- End Placeholder Image ---

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused(); // Hook to detect screen focus

  // --- Fetch Products ---
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const dbResult = await getAllProducts();
      setProducts(dbResult);
    } catch (error) {
      console.error("Failed to load products:", error);
      Alert.alert("Error", "Could not load products from database.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Load products when screen comes into focus ---
  useEffect(() => {
    if (isFocused) {
      console.log("ProductListScreen focused, loading products...");
      loadProducts();
    }
  }, [isFocused]); // Dependency array includes isFocused

  const goToRegisterProduct = () => {
    navigation.navigate('RegisterProduct');
  };

  // --- Render Item for FlatList ---
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={stylesProductList.itemContainer}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
         source={item.imageUri ? { uri: item.imageUri } : placeholderImage}
         style={stylesProductList.itemImage}
         onError={(e) => console.log("List Image Load Error:", e.nativeEvent.error, item.imageUri)}
       />
      <View style={stylesProductList.itemTextContainer}>
        <Text style={stylesProductList.itemName}>{item.name || `Product ID: ${item.id}`}</Text>
        {/* Updated Currency */}
        <Text style={stylesProductList.itemPrice}>Rs. {item.price.toFixed(2)}</Text>
      </View>
      <Text style={stylesProductList.itemQty}>Qty: {item.qty}</Text>
    </TouchableOpacity>
  );
  // --- End Render Item ---

  return (
    <SafeAreaView style={stylesProductList.safeArea}>
      <View style={stylesProductList.container}>
        {/* Register Button at the top */}
        <TouchableOpacity style={stylesProductList.registerButton} onPress={goToRegisterProduct}>
          <Text style={stylesProductList.registerButtonText}>Register New Product</Text>
        </TouchableOpacity>

        {/* Product List */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }}/>
        ) : products.length === 0 ? (
            <Text style={stylesProductList.emptyText}>No products found. Register a new one!</Text>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id.toString()}
            style={stylesProductList.list}
            contentContainerStyle={stylesProductList.listContent}
            ItemSeparatorComponent={() => <View style={stylesProductList.separator} />}
            refreshing={isLoading}
            onRefresh={loadProducts}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// --- Styles for Product List Screen ---
const stylesProductList = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background
  },
  container: {
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#28a745', // Green color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 15, // Add margin around the button
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1, // Ensure list takes remaining space
  },
  listContent: {
      paddingHorizontal: 15, // Padding for list items
      paddingBottom: 20,
      flexGrow: 1, // Needed for empty text centering
  },
  itemContainer: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  itemImage: {
    width: 60,
    height: 50,
    borderRadius: 4,
    marginRight: 15,
    backgroundColor: '#eee', // Placeholder bg
  },
  itemTextContainer: {
    flex: 1, // Allow text to take available space
    marginRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4, // Space between name and price
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF', // Blue color for price
  },
  itemQty: {
      fontSize: 14,
      color: '#666',
  },
  separator: {
      height: 10, // Creates space between items
  },
  emptyText: {
      flex: 1,
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: '#6c757d',
  }
});

