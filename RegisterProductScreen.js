import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    SafeAreaView, ScrollView, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker
import { addProduct } from './database'; // Import DB function

// --- Placeholder Image ---
const placeholderRegisterImage = require('./assets/placeholder-image.png');
// --- End Placeholder Image ---


export default function RegisterProductScreen({ navigation }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState(null); // Store selected image URI
  const [isRegistering, setIsRegistering] = useState(false);

  // --- Image Picker Logic ---
  const pickImage = async () => {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "Camera permission is required to take a picture.");
      return;
    }

    // Launch camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // Optional: allow editing (cropping)
      aspect: [4, 3], // Optional: aspect ratio for cropper
      quality: 0.5, // Optional: image quality (0 to 1)
    });

    console.log("ImagePicker Result:", result);

    if (!result.canceled) {
        // Check assets array and get the uri
        if (result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            console.log("Image URI set:", result.assets[0].uri);
        } else {
             console.log("No assets found in image picker result");
        }
    } else {
        console.log("Image picking cancelled");
    }
  };

  // --- Registration Logic ---
  const handleRegister = async () => {
    // Basic Validation
    const numQty = parseInt(qty, 10);
    const numPrice = parseFloat(price);

    if (isNaN(numQty) || numQty < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid quantity (must be a non-negative number).');
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid price (must be a non-negative number).');
      return;
    }
    // Name is optional

    setIsRegistering(true);

    try {
      // Generate unique numeric ID (using timestamp)
      const productId = Date.now();

      // Call database function to add product
      await addProduct(productId, name, numQty, numPrice, imageUri);

      Alert.alert('Success', 'Product registered successfully!');
      // Clear form or navigate back
      setName('');
      setQty('');
      setPrice('');
      setImageUri(null);
      navigation.goBack(); // Go back to the product list

    } catch (error) {
      console.error("Failed to register product:", error);
      Alert.alert('Error', 'Failed to register product. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={stylesRegister.safeArea}>
      <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={stylesRegister.scrollContainer}>
          <View style={stylesRegister.container}>
            <Text style={stylesRegister.title}>Register New Product</Text>

            {/* Product Name Input */}
            <TextInput
              style={stylesRegister.input}
              placeholder="Product Name (Optional)"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />

            {/* Quantity Input */}
            <TextInput
              style={stylesRegister.input}
              placeholder="Quantity"
              placeholderTextColor="#aaa"
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric" // Show numeric keyboard
            />

            {/* Price Input */}
            <TextInput
              style={stylesRegister.input}
              placeholder="Price (e.g., 150.00)" // Updated placeholder
              placeholderTextColor="#aaa"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad" // Show decimal keyboard
            />

            {/* Image Picker */}
            <TouchableOpacity style={stylesRegister.imagePickerButton} onPress={pickImage}>
              <Text style={stylesRegister.imagePickerButtonText}>Take Product Photo</Text>
            </TouchableOpacity>

            {/* Image Preview */}
            <Image
                source={imageUri ? { uri: imageUri } : placeholderRegisterImage} // Show selected or placeholder
                style={stylesRegister.imagePreview}
            />


            {/* Register Button */}
            <TouchableOpacity
              style={[stylesRegister.registerButton, isRegistering && stylesRegister.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={stylesRegister.registerButtonText}>Register Product</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles for Register Product Screen ---
const stylesRegister = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
   scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center', // Center content vertically
  },
  container: {
    flex: 1, // Takes available space in ScrollView
    padding: 25,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f8f9fa', // Light background for input
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20, // Increased spacing
    fontSize: 16,
    color: '#333',
  },
  imagePickerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePickerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '80%',
    height: 200, // Fixed height for preview
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#eee', // Placeholder bg
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    backgroundColor: '#28a745', // Green color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10, // Space above button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
   registerButtonDisabled: {
      backgroundColor: '#a3d9b1', // Lighter green when disabled
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
