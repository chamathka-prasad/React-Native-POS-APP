import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity, // More customizable button
  KeyboardAvoidingView,
  Platform,
  Alert, // Simple alert for feedback
  ActivityIndicator, // Show loading state
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Ensures content is within safe area bounds

// Receive the signIn function via props
export default function LoginScreen({ signIn }) {
  // State for input fields and loading status
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Loading indicator for login process

  // Function to handle the login button press
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    setIsLoggingIn(true); // Show loading indicator
    try {
      // Call the signIn function passed from App.js
      await signIn(username, password);
      // If signIn is successful, App.js will handle navigation
      // If signIn throws an error (e.g., invalid credentials), it's caught below
    } catch (error) {
      // Handle errors from the signIn function (optional, depends on signIn implementation)
      // Alert.alert('Login Failed', error.message || 'An unexpected error occurred.');
      // Note: The current signIn implementation uses Alert directly, so this catch might not be needed
      // unless you modify signIn to throw errors.
      console.error("Login attempt failed:", error);
    } finally {
      setIsLoggingIn(false); // Hide loading indicator regardless of outcome
    }
  };

  return (
    // SafeAreaView avoids notches and status bars
    <SafeAreaView style={stylesLogin.safeArea}>
      {/* KeyboardAvoidingView adjusts layout when keyboard appears */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={stylesLogin.container}
      >
        <View style={stylesLogin.innerContainer}>
          <Text style={stylesLogin.title}>Welcome Back!</Text>
          <Text style={stylesLogin.subtitle}>Sign in to continue</Text>

          {/* Username Input */}
          <TextInput
            style={stylesLogin.input}
            placeholder="Username"
            placeholderTextColor="#aaa" // Light grey placeholder text
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none" // Don't automatically capitalize
            keyboardType="default" // Standard keyboard
            returnKeyType="next" // Show "Next" button on keyboard
            onSubmitEditing={() => { this.passwordInput.focus(); }} // Focus password field on submit
            blurOnSubmit={false} // Keep keyboard open
          />

          {/* Password Input */}
          <TextInput
            ref={(input) => { this.passwordInput = input; }} // Ref to focus programmatically
            style={stylesLogin.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // Hide password characters
            returnKeyType="done" // Show "Done" button on keyboard
            onSubmitEditing={handleLogin} // Attempt login on submit
          />

          {/* Login Button */}
          <TouchableOpacity
            style={stylesLogin.button}
            onPress={handleLogin}
            disabled={isLoggingIn} // Disable button while logging in
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#ffffff" /> // Show spinner
            ) : (
              <Text style={stylesLogin.buttonText}>Login</Text> // Show text
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles for the Login Screen
const stylesLogin = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7', // Light background color
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
  },
  innerContainer: {
    paddingHorizontal: 30, // Add horizontal padding
    alignItems: 'center', // Center items horizontally
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333', // Darker text color
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666', // Grey text color
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff', // White background for input
    borderWidth: 1,
    borderColor: '#ddd', // Light grey border
    borderRadius: 8, // Rounded corners
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF', // Standard blue button color
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10, // Add some space above the button
    shadowColor: '#000', // Add subtle shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Add shadow (Android)
  },
  buttonText: {
    color: '#ffffff', // White text
    fontSize: 18,
    fontWeight: 'bold',
  },
});
