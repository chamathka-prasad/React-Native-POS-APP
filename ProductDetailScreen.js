import React, { useState, useEffect, useCallback } from 'react'; // Import useState, useEffect, useCallback
import {
    StyleSheet, Text, View, SafeAreaView, Image, ScrollView,
    ActivityIndicator, Alert, Button, TouchableOpacity, Modal, TextInput // Added TouchableOpacity, Modal, TextInput
} from 'react-native';
import { getProductById, updateProduct } from './database'; // Import DB functions

// --- Placeholder Image ---
const placeholderDetailImage = require('./assets/placeholder-image.png');
// --- End Placeholder Image ---


export default function ProductDetailScreen({ route, navigation }) {

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [isSaving, setIsSaving] = useState(false); // State for save operation
  const [isModalVisible, setIsModalVisible] = useState(false); // State for print modal
  const [printQty, setPrintQty] = useState('1'); // State for print quantity input

  // State for editable fields
  const [editableName, setEditableName] = useState('');
  const [editableQty, setEditableQty] = useState('');
  const [editablePrice, setEditablePrice] = useState('');

  const { productId } = route.params || {}; // Get productId passed from list screen

  // --- Fetch Product Details ---
  const loadProductDetails = useCallback(async () => {
    if (!productId) {
      Alert.alert("Error", "No product ID provided.");
      setIsLoading(false);
      if(navigation.canGoBack()) navigation.goBack();
      return;
    }
    console.log(`Loading details for product ID: ${productId}`);
    setIsLoading(true);
    try {
      const dbResult = await getProductById(productId);
      if (dbResult) {
        setProduct(dbResult);
        // Initialize editable state when data loads
        setEditableName(dbResult.name || '');
        setEditableQty(dbResult.qty.toString());
        setEditablePrice(dbResult.price.toFixed(2)); // Keep price format consistent
      } else {
        Alert.alert("Not Found", `Product with ID ${productId} not found.`);
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to load product details:", error);
      Alert.alert("Error", "Could not load product details.");
    } finally {
      setIsLoading(false);
    }
  }, [productId, navigation]); // Include navigation in dependency array

  useEffect(() => {
    loadProductDetails();
  }, [loadProductDetails]); // Load details when component mounts or productId changes (via useCallback)

  // --- Edit Mode Toggle ---
  const handleEditToggle = () => {
      if (!product) return; // Don't allow edit if no product loaded
      if (!isEditing) {
          // Entering edit mode, sync editable state with current product state
          setEditableName(product.name || '');
          setEditableQty(product.qty.toString());
          setEditablePrice(product.price.toFixed(2)); // Keep price format consistent
      }
      setIsEditing(!isEditing);
  };

  // --- Save Changes ---
  const handleSaveChanges = async () => {
      if (!product) return;

      // Validate inputs
      const numQty = parseInt(editableQty, 10);
      const numPrice = parseFloat(editablePrice);

      if (isNaN(numQty) || numQty < 0) {
          Alert.alert('Invalid Input', 'Please enter a valid quantity.');
          return;
      }
      if (isNaN(numPrice) || numPrice < 0) {
          Alert.alert('Invalid Input', 'Please enter a valid price.');
          return;
      }

      setIsSaving(true);
      try {
          await updateProduct(product.id, editableName, numQty, numPrice);
          Alert.alert('Success', 'Product updated successfully!');
          setIsEditing(false); // Exit edit mode
          await loadProductDetails(); // Reload data to show updated values
      } catch (error) {
          console.error("Failed to update product:", error);
          Alert.alert('Error', 'Failed to update product.');
      } finally {
          setIsSaving(false);
      }
  };

  // --- Cancel Edit ---
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Optionally reset editable fields back to original product values if needed
        if (product) {
            setEditableName(product.name || '');
            setEditableQty(product.qty.toString());
            setEditablePrice(product.price.toFixed(2));
        }
    };

  // --- Print Modal Toggle ---
  const toggleModal = () => {
      setIsModalVisible(!isModalVisible);
      if (!isModalVisible) {
          setPrintQty('1'); // Reset quantity when opening modal
      }
  };

  // --- Handle Print Action (Simulation) ---
  const handlePrint = () => {
      const quantity = parseInt(printQty, 10);
      if (isNaN(quantity) || quantity <= 0) {
          Alert.alert('Invalid Quantity', 'Please enter a valid number of barcodes to print.');
          return;
      }

      console.log(`--- PRINT SIMULATION ---`);
      console.log(`Product ID: ${product?.id}`);
      console.log(`Product Name: ${product?.name}`);
      console.log(`Quantity to Print: ${quantity}`);
      console.log(`--- END PRINT SIMULATION ---`);

      Alert.alert(
          'Print Simulation',
          `Simulating printing ${quantity} barcode(s) for "${product?.name || `ID: ${product?.id}`}".\n\n(Actual Bluetooth printing requires specific libraries and printer setup.)`
      );

      toggleModal(); // Close modal after simulation
  };


  // --- Render Loading or Not Found State ---
  if (isLoading) {
    return (
      <SafeAreaView style={stylesProductDetail.safeArea}>
        <View style={[stylesProductDetail.container, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading Product Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
     return (
      <SafeAreaView style={stylesProductDetail.safeArea}>
        <View style={[stylesProductDetail.container, { justifyContent: 'center' }]}>
          <Text style={stylesProductDetail.notFoundText}>Product not found.</Text>
           <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Render Product Details / Edit Form ---
  return (
    <SafeAreaView style={stylesProductDetail.safeArea}>
      <ScrollView contentContainerStyle={stylesProductDetail.scrollContainer}>
        <View style={stylesProductDetail.container}>

          {/* Edit/Save/Cancel Buttons */}
           <View style={stylesProductDetail.headerButtons}>
                {!isEditing ? (
                    <TouchableOpacity style={stylesProductDetail.headerButton} onPress={handleEditToggle}>
                        <Text style={stylesProductDetail.headerButtonText}>Edit</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity style={[stylesProductDetail.headerButton, stylesProductDetail.cancelButton]} onPress={handleCancelEdit} disabled={isSaving}>
                            <Text style={stylesProductDetail.headerButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[stylesProductDetail.headerButton, stylesProductDetail.saveButton]} onPress={handleSaveChanges} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#fff" size="small"/> : <Text style={stylesProductDetail.headerButtonText}>Save</Text>}
                        </TouchableOpacity>
                    </>
                )}
            </View>


          {/* Product Image (Not editable in this version) */}
           <Text style={stylesProductDetail.imageLabel}>Product Image:</Text>
          <Image
            source={product.imageUri ? { uri: product.imageUri } : placeholderDetailImage}
            style={stylesProductDetail.productImage}
            resizeMode="contain"
            onError={(e) => console.log("Detail Image Load Error:", e.nativeEvent.error, product.imageUri)}
          />

          {/* Product Details / Inputs */}
          <View style={stylesProductDetail.detailsContainer}>
             {/* Name */}
             <View style={stylesProductDetail.detailRow}>
                <Text style={stylesProductDetail.detailLabel}>Name:</Text>
                {isEditing ? (
                    <TextInput
                        style={stylesProductDetail.input}
                        value={editableName}
                        onChangeText={setEditableName}
                        placeholder="Product Name"
                    />
                ) : (
                    <Text style={stylesProductDetail.detailValue}>{product.name || '(No Name)'}</Text>
                )}
            </View>
            {/* Price */}
            <View style={stylesProductDetail.detailRow}>
              <Text style={stylesProductDetail.detailLabel}>Price:</Text>
               {isEditing ? (
                    <TextInput
                        style={stylesProductDetail.input}
                        value={editablePrice}
                        onChangeText={setEditablePrice}
                        placeholder="Price"
                        keyboardType="decimal-pad"
                    />
                ) : (
                     // Updated Currency
                     <Text style={stylesProductDetail.detailValue}>Rs. {product.price.toFixed(2)}</Text>
                )}
            </View>
             {/* Quantity */}
            <View style={stylesProductDetail.detailRow}>
              <Text style={stylesProductDetail.detailLabel}>Quantity:</Text>
              {isEditing ? (
                    <TextInput
                        style={stylesProductDetail.input}
                        value={editableQty}
                        onChangeText={setEditableQty}
                        placeholder="Quantity"
                        keyboardType="numeric"
                    />
                ) : (
                    <Text style={stylesProductDetail.detailValue}>{product.qty}</Text>
                )}
            </View>
            {/* Non-Editable Fields */}
             <View style={stylesProductDetail.detailRow}>
              <Text style={stylesProductDetail.detailLabel}>Product ID:</Text>
              <Text style={stylesProductDetail.detailValue}>{product.id}</Text>
            </View>
             <View style={stylesProductDetail.detailRow}>
              <Text style={stylesProductDetail.detailLabel}>Registered:</Text>
              <Text style={stylesProductDetail.detailValue}>{new Date(product.registeredDate).toLocaleString()}</Text>
            </View>
             <View style={[stylesProductDetail.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={stylesProductDetail.detailLabel}>Last Updated:</Text>
              <Text style={stylesProductDetail.detailValue}>{new Date(product.updatedDate).toLocaleString()}</Text>
            </View>
          </View>

          {/* Print Button (only visible when not editing) */}
           {!isEditing && (
                <TouchableOpacity style={stylesProductDetail.printButton} onPress={toggleModal}>
                    <Text style={stylesProductDetail.printButtonText}>Print Barcodes</Text>
                </TouchableOpacity>
            )}

        </View>
      </ScrollView>

       {/* Print Modal */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={toggleModal}
        >
            <View style={stylesProductDetail.modalOverlay}>
                <View style={stylesProductDetail.modalContent}>
                    <Text style={stylesProductDetail.modalTitle}>Print Barcodes</Text>
                    <Text style={stylesProductDetail.modalProductInfo}>Product: {product.name || `ID: ${product.id}`}</Text>

                    <TextInput
                        style={stylesProductDetail.modalInput}
                        placeholder="Number of barcodes to print"
                        placeholderTextColor="#aaa"
                        keyboardType="number-pad"
                        value={printQty}
                        onChangeText={setPrintQty}
                    />

                    <View style={stylesProductDetail.modalButtonContainer}>
                        <TouchableOpacity
                            style={[stylesProductDetail.modalButton, stylesProductDetail.modalCloseButton]}
                            onPress={toggleModal}
                        >
                            <Text style={stylesProductDetail.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                         <TouchableOpacity
                            style={[stylesProductDetail.modalButton, stylesProductDetail.modalPrintButton]}
                            onPress={handlePrint}
                        >
                            <Text style={stylesProductDetail.modalButtonText}>Print</Text>
                        </TouchableOpacity>
                    </View>
                     <Text style={stylesProductDetail.modalNote}>Note: Actual Bluetooth printing requires specific setup.</Text>
                </View>
            </View>
        </Modal>

    </SafeAreaView>
  );
}

// --- Styles for Product Detail Screen ---
const stylesProductDetail = StyleSheet.create({
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
   notFoundText: {
      fontSize: 18,
      color: '#6c757d',
      marginBottom: 20,
  },
  headerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between', // Place buttons apart
      width: '90%',
      marginBottom: 15,
  },
  headerButton: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 20, // Pill shape
      backgroundColor: '#007AFF', // Blue for Edit
  },
   saveButton: {
      backgroundColor: '#28a745', // Green for Save
   },
   cancelButton: {
       backgroundColor: '#6c757d', // Grey for Cancel
   },
   headerButtonText: {
       color: '#fff',
       fontWeight: 'bold',
       fontSize: 14,
   },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10, // Reduced margin
    textAlign: 'center',
  },
  imageLabel: {
      fontSize: 14,
      color: '#666',
      marginTop: 10,
      marginBottom: 5,
      alignSelf: 'flex-start',
      marginLeft: '5%', // Align with details container
  },
  productImage: {
    width: '90%',
    aspectRatio: 16 / 9,
    height: undefined,
    borderRadius: 10,
    marginBottom: 20, // Reduced margin
    backgroundColor: '#eee',
  },
  detailsContainer: {
    width: '90%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 40, // Ensure consistent row height, esp. for inputs
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginRight: 10,
    flex: 1, // Allow label to take some space
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flexShrink: 1,
    textAlign: 'right',
    flex: 2, // Allow value to take more space
  },
  input: { // Style for TextInput in edit mode
      fontSize: 16,
      color: '#333',
      fontWeight: 'bold',
      flex: 2, // Allow input to take more space
      textAlign: 'right',
      borderBottomWidth: 1,
      borderColor: '#ccc',
      paddingVertical: 5, // Adjust padding
  },
  printButton: {
      backgroundColor: '#17a2b8', // Info color (cyan)
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      width: '90%',
      alignItems: 'center',
      marginTop: 10, // Space above button
  },
  printButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 25,
      width: '85%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
      color: '#333',
  },
  modalProductInfo: {
      fontSize: 14,
      color: '#555',
      marginBottom: 20,
      textAlign: 'center',
  },
  modalInput: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      width: '100%',
      marginBottom: 20,
      fontSize: 16,
      textAlign: 'center',
  },
  modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between', // Space out buttons
      width: '100%',
      marginTop: 10,
  },
  modalButton: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      flex: 1, // Make buttons take equal width
      alignItems: 'center',
      marginHorizontal: 5, // Add space between buttons
  },
  modalCloseButton: {
      backgroundColor: '#6c757d', // Grey
  },
  modalPrintButton: {
      backgroundColor: '#17a2b8', // Cyan
  },
  modalButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
  },
    modalNote: {
        marginTop: 15,
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
});
